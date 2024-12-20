'use client';

import { useEffect, useState } from 'react';

interface Product {
  titulo: string;
  precio: string;
  enlace: string;
}

export default function Results() {
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/results');
        const data = await response.json();
        
        if (response.status === 404) {
          setError(data.message || 'No hay resultados disponibles');
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        
        if (Array.isArray(data)) {
          setResults(data);
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          throw new Error('Formato de datos inválido');
        }
      } catch (error) {
        console.error('Error loading results:', error);
        setError(error instanceof Error ? error.message : 'Error al cargar resultados');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, []);

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Cargando resultados...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">No hay resultados</h2>
        <p className="text-gray-400">No se encontraron productos para esta búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Resultados de la búsqueda</h2>
      
      <div className="space-y-4">
        {results.map((product, index) => (
          <div key={index} className="bg-black/30 border border-gray-700 p-4 rounded-lg hover:border-purple-500 transition-colors">
            <h3 className="text-xl font-semibold text-white">{product.titulo}</h3>
            <p className="text-lg text-green-400 my-2">$ {product.precio}</p>
            <a 
              href={product.enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 hover:underline"
            >
              Ver publicación
            </a>
          </div>
        ))}
      </div>
    </div>
  );
} 