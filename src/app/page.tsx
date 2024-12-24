'use client';

import { useState, useEffect } from 'react';
import Results from './results/page';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [previousSearches, setPreviousSearches] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'results'>('results');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSearch, setSelectedSearch] = useState('');

  useEffect(() => {
    const loadPreviousSearches = async () => {
      try {
        const response = await fetch('/api/previous-searches');
        if (response.ok) {
          const searches = await response.json();
          setPreviousSearches(searches);
        }
      } catch (error) {
        console.error('Error al cargar búsquedas previas:', error);
      }
    };

    loadPreviousSearches();
  }, []);

  const handleSelectPreviousSearch = (value: string) => {
    setSearchTerm(value);
    setSelectedSearch(value);
    setIsDropdownOpen(false);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setLogs([]);
    setError('');
    setShowResults(false);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchTerm }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No se pudo obtener el reader');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n')
          .map(line => line.replace('data: ', ''))
          .filter(line => line.trim() || line === '');
        
        setLogs(prevLogs => [...prevLogs, ...lines]);
      }

      setShowResults(true);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Error durante la búsqueda');
      setLogs(prevLogs => [...prevLogs, 'Error durante la búsqueda']);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleDeleteSearch = async (searchTerm: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch('/api/delete-search', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchTerm }),
      });

      const data = await response.json();

      if (response.ok) {
        // Actualizar la lista de búsquedas previas
        setPreviousSearches(prevSearches => 
          prevSearches.filter(search => search !== searchTerm)
        );
        
        // Agregar logs sobre los archivos eliminados
        setLogs(prevLogs => [
          ...prevLogs,
          `🗑️ Eliminando búsqueda: ${searchTerm}`,
          `📝 ${data.message}`,
          ...data.deletedFiles.map((file: string) => `   📄 Eliminado: ${file}`)
        ]);
        
        setIsDropdownOpen(false);
      } else {
        console.error('Error al eliminar la búsqueda:', data.error);
        setLogs(prevLogs => [
          ...prevLogs,
          `❌ Error al eliminar búsqueda: ${data.error}`,
          data.details ? `   📝 Detalles: ${data.details}` : ''
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
      setLogs(prevLogs => [
        ...prevLogs,
        `❌ Error al procesar la eliminación: ${error instanceof Error ? error.message : 'Error desconocido'}`
      ]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('search-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Busqueda en mercado libre..."
            style={{
              width: '300px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#2d2d2d',
              color: 'white',
              outline: 'none',
              border: 'none'
            }}
            disabled={isSearching}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: '12px 24px',
              backgroundColor: '#443a91',
              color: 'white',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7d3ff8'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#443a91'}
            disabled={isSearching}
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        <div style={{ position: 'relative', width: '300px' }}>
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#2d2d2d',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ color: selectedSearch ? 'white' : '#6b7280' }}>
              {selectedSearch || 'Seleccionar búsqueda previa'}
            </span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="white"
              style={{
                transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s'
              }}
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>

          {isDropdownOpen && (
            <div
              id="search-dropdown"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#2d2d2d',
                borderRadius: '8px',
                marginTop: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                border: '1px solid #4a4a4a'
              }}
            >
              {previousSearches.map((search, index) => (
                <div
                  key={index}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3d3d3d'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: index < previousSearches.length - 1 ? '1px solid #4a4a4a' : 'none'
                  }}
                >
                  <span
                    onClick={() => handleSelectPreviousSearch(search)}
                    style={{
                      flex: 1,
                      color: 'white'
                    }}
                  >
                    {search}
                  </span>
                  <button
                    onClick={(e) => handleDeleteSearch(search, e)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div 
          style={{
            width: '800px',
            height: '600px',
            backgroundColor: '#1e1e1e',
            borderRadius: '8px',
            border: '1px solid #4a4a4a',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #4a4a4a',
          }}>
            <button
              onClick={() => setActiveTab('results')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'results' ? '#2d2d2d' : 'transparent',
                color: activeTab === 'results' ? '#fff' : '#666',
                border: 'none',
                borderRight: '1px solid #4a4a4a',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flex: 1,
                fontSize: '14px'
              }}
            >
              Resultados
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'logs' ? '#2d2d2d' : 'transparent',
                color: activeTab === 'logs' ? '#fff' : '#666',
                border: 'none',
                borderLeft: '1px solid #4a4a4a',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flex: 1,
                fontSize: '14px'
              }}
            >
              Logs
            </button>
          </div>

          <div style={{
            padding: '16px',
            overflowY: 'auto',
            flex: 1,
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            {activeTab === 'results' ? (
              showResults ? (
                <Results />
              ) : (
                <div style={{ color: '#666', textAlign: 'center', marginTop: '16px' }}>
                  Los resultados de la búsqueda aparecerán aquí...
                </div>
              )
            ) : (
              <div className="log-container">
                {logs.map((log, index) => (
                  <div 
                    key={index}
                    className={`log-line ${log === '' && logs[index - 1] === '' ? 'double-break' : ''}`}
                    style={{
                      color: log.includes('PUBLICACIÓN NUEVA') 
                        ? '#4ade80'
                        : log.includes('Error')
                        ? '#f87171'
                        : log.includes('🌐')
                        ? '#60a5fa'
                        : log.includes('📦')
                        ? '#c084fc'
                        : '#d1d5db'
                    }}
                  >
                    {log.replace('data: ', '')}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-8 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}