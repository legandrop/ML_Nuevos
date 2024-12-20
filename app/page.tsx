'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setLogs([]);
    setError('');

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

      // Una vez terminado, navegar a la página de resultados
      router.push('/results');
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Error durante la búsqueda');
      setLogs(prevLogs => [...prevLogs, 'Error durante la búsqueda']);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Buscador de Mercado Libre</h1>
        
        <div className="flex gap-4 mb-8">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ej: Toyota Corolla Cross"
            className="flex-1 p-2 border rounded"
            disabled={isSearching}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {logs.length > 0 && (
          <div className="bg-black text-green-400 p-4 rounded font-mono whitespace-pre-wrap">
            {logs.map((log, index) => (
              <div key={index}>{log.replace('data: ', '')}</div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
} 