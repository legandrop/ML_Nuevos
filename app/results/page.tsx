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
          <span style={{ color: '#D3D3D3', fontWeight: 800 }}>Búsqueda previa</span>{' '}
          <span style={{ color: '#969696' }}>({results.previousResults.date}):</span>{' '}
          <span className="text-purple-400" style={{ fontWeight: 800 }}>{results.previousResults.count}</span>
        </div>
        <div className="p-2 bg-gray-800/50 rounded">
          <span style={{ color: '#D3D3D3', fontWeight: 800 }}>Búsqueda nueva</span>{' '}
          <span style={{ color: '#969696' }}>({results.currentResults.date}):</span>{' '}
          <span className="text-purple-400" style={{ fontWeight: 800 }}>{results.currentResults.count}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div style={{ 
          fontSize: '0.875rem',
          color: '#D3D3D3',
          fontWeight: 800,
          marginTop: '10px',
          marginBottom: '4px'
        }}>
          Productos nuevos:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {results.newProducts.map((product, index) => (
            <div 
              key={index} 
              className="flex items-center text-sm hover:bg-gray-800/50 transition-colors p-2 bg-gray-800/30 rounded"
            >
              <a 
                href={product.enlace}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: '#443a91',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7d3ff8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#443a91'}
              >
                Link
              </a>
              <span className="mx-2 text-gray-400"> | </span>
              <span className="text-green-400 whitespace-nowrap">
                $ {product.precio}
              </span>
              <span className="mx-2 text-gray-400"> | </span>
              <span className="text-white flex-1">{product.titulo}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 