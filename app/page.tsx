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
    <main className="min-h-screen flex items-center justify-center bg-[#1e1e1e]">
      <div className="w-full max-w-4xl mx-auto p-8 space-y-8">
        <div className="flex flex-col items-center space-y-8">
          <h1 className="text-3xl font-bold text-white">Probando Otro</h1>
          
          <div className="w-full flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ej: Toyota Corolla Cross"
              className="flex-1 p-3 rounded-md input-dark text-white placeholder-gray-400"
              disabled={isSearching}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-3 bg-[#8b5cf6] text-white rounded-md hover:bg-[#7c3aed] disabled:bg-opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {error && (
            <div className="w-full bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {logs.length > 0 && (
            <div className="w-full bg-black/50 text-green-400 p-4 rounded font-mono whitespace-pre-wrap border border-gray-700">
              {logs.map((log, index) => (
                <div key={index}>{log.replace('data: ', '')}</div>
              ))}
            </div>
          )}

          {showResults && <Results />}
        </div>
      </div>
    </main>
  );
}