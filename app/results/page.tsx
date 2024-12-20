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
        
        // Verifica si data es un array
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
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Cargando resultados...</h1>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Error</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (results.length === 0) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">No hay resultados</h1>
          <p>No se encontraron productos para esta búsqueda.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Resultados de la búsqueda</h1>
        
        <div className="space-y-4">
          {results.map((product, index) => (
            <div key={index} className="border p-4 rounded">
              <h2 className="text-xl font-semibold">{product.titulo}</h2>
              <p className="text-lg text-green-600">$ {product.precio}</p>
              <a 
                href={product.enlace}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Ver publicación
              </a>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
} 