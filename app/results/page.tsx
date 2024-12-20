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
      <div className="mt-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
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
      <div className="mt-8">
        <p className="text-gray-400">No se encontraron resultados.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="space-y-4">
        <p className="text-lg">
          Resultados únicos de búsqueda previa {results.previousResults.date}:{' '}
          <span className="font-bold">{results.previousResults.count}</span>
        </p>

        <p className="text-lg">
          Resultados únicos de nueva búsqueda {results.currentResults.date}:{' '}
          <span className="font-bold">{results.currentResults.count}</span>
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Resultados nuevos:</h2>
        <div className="space-y-2">
          {results.newProducts.map((product, index) => (
            <div key={index} className="flex items-center gap-4">
              <span className="text-white">{product.titulo}</span>
              <span className="text-green-400">$ {product.precio}</span>
              <a 
                href={product.enlace}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 hover:underline"
              >
                Link
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 