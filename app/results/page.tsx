'use client';

import { useEffect, useState } from 'react';

interface Product {
  titulo: string;
  precio: string;
  enlace: string;
}

interface ResultsData {
  previousResults: {
    date: string;
    count: number;
  };
  currentResults: {
    date: string;
    count: number;
  };
  newProducts: Product[];
}

export default function Results() {
  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/results');
        
        if (!response.ok) {
          throw new Error(response.status === 404 
            ? 'No hay resultados disponibles' 
            : 'Error al cargar resultados');
        }

        const data = await response.json();
        setResults(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error al cargar resultados');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, []);

  if (loading) {
    return (
      <div className="mt-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"/>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!results) {
    return (
      <div className="mt-8 text-gray-400">
        No se encontraron resultados.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm">
        <div className="p-2 bg-gray-800/50 rounded">
          <span className="text-gray-400">Búsqueda previa ({results.previousResults.date}):</span>{' '}
          <span className="text-purple-400 font-bold">{results.previousResults.count}</span>
        </div>
        <div className="p-2 bg-gray-800/50 rounded">
          <span className="text-gray-400">Nueva búsqueda ({results.currentResults.date}):</span>{' '}
          <span className="text-purple-400 font-bold">{results.currentResults.count}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-purple-400 font-bold">Productos nuevos:</div>
        {results.newProducts.map((product, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between p-2 bg-gray-800/30 rounded text-sm hover:bg-gray-800/50 transition-colors"
          >
            <span className="text-white flex-1 truncate mr-2">{product.titulo}</span>
            <span className="text-green-400 mx-2 whitespace-nowrap">
              $ {product.precio}
            </span>
            <a 
              href={product.enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors text-xs"
            >
              Link
            </a>
          </div>
        ))}
      </div>
    </div>
  );
} 