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
  const [activeTab, setActiveTab] = useState<'logs' | 'results'>('logs');

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

  const handleSelectPreviousSearch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchTerm(e.target.value);
    e.target.value = '';
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
        const lines = text.split('\n');
        
        setLogs(prevLogs => [...prevLogs, ...lines.filter(line => line.trim())]);
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

        <select
          onChange={handleSelectPreviousSearch}
          style={{
            width: '300px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: '#2d2d2d',
            color: 'white',
            outline: 'none',
            border: 'none',
            paddingRight: '35px',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            backgroundSize: '20px'
          }}
          value=""
        >
          <option value="">Seleccionar búsqueda previa</option>
          {previousSearches.map((search, index) => (
            <option key={index} value={search}>
              {search}
            </option>
          ))}
        </select>

        <div 
          style={{
            width: '800px',
            height: '300px',
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
              onClick={() => setActiveTab('logs')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'logs' ? '#2d2d2d' : 'transparent',
                color: activeTab === 'logs' ? '#fff' : '#666',
                border: 'none',
                borderRight: '1px solid #4a4a4a',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flex: 1,
                fontSize: '14px'
              }}
            >
              Logs
            </button>
            <button
              onClick={() => setActiveTab('results')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === 'results' ? '#2d2d2d' : 'transparent',
                color: activeTab === 'results' ? '#fff' : '#666',
                border: 'none',
                borderLeft: '1px solid #4a4a4a',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flex: 1,
                fontSize: '14px'
              }}
            >
              Resultados
            </button>
          </div>

          <div style={{
            padding: '16px',
            overflowY: 'auto',
            flex: 1,
            fontFamily: 'monospace',
            fontSize: '14px'
          }}>
            {activeTab === 'logs' ? (
              <div className="space-y-1">
                {logs.length === 0 ? (
                  <div style={{ color: '#666', textAlign: 'center', marginTop: '16px' }}>
                    Los logs de la búsqueda aparecerán aquí...
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div 
                      key={index}
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
                  ))
                )}
              </div>
            ) : (
              showResults && <Results />
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