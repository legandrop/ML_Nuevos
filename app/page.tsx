'use client';

import { useState } from 'react';
import Results from './results/page';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);

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

      // En lugar de navegar, mostrar los resultados
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
      <div style={{ display: 'flex', gap: '24px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ej: Toyota Corolla Cross"
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
            backgroundColor: '#8b5cf6',
            color: 'white',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
          disabled={isSearching}
        >
          {isSearching ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {error && (
        <div className="mt-8 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {logs.length > 0 && (
        <div className="mt-8 bg-black/50 text-green-400 p-4 rounded font-mono whitespace-pre-wrap border border-gray-700">
          {logs.map((log, index) => (
            <div key={index}>{log.replace('data: ', '')}</div>
          ))}
        </div>
      )}

      {showResults && <Results />}
    </div>
  );
}