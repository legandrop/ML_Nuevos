import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'src', 'backend', 'data');
    
    // Obtener todos los archivos JSON
    const files = fs.readdirSync(dataDir)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => {
        return fs.statSync(path.join(dataDir, b)).mtime.getTime() - 
               fs.statSync(path.join(dataDir, a)).mtime.getTime();
      });

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No hay resultados disponibles' }, 
        { status: 404 }
      );
    }

    // Leer el archivo más reciente y el anterior
    const currentFile = files[0];
    const previousFile = files[1];

    const currentData = JSON.parse(
      fs.readFileSync(path.join(dataDir, currentFile), 'utf-8')
    );

    let previousData = null;
    if (previousFile) {
      previousData = JSON.parse(
        fs.readFileSync(path.join(dataDir, previousFile), 'utf-8')
      );
    }

    // Extraer fecha y hora del nombre del archivo
    const getDateFromFilename = (filename: string) => {
      const match = filename.match(/(\d{8})_(\d{6})/);
      if (match) {
        const [_, date, time] = match;
        return `${date.slice(6,8)}/${date.slice(4,6)}/${date.slice(0,4)}, ${time.slice(0,2)}:${time.slice(2,4)}:${time.slice(4,6)}`;
      }
      return 'Fecha desconocida';
    };

    // Identificar productos nuevos
    const previousProducts = new Set(
      previousData?.map((p: Product) => `${p.titulo}-${p.precio}`) || []
    );

    const newProducts = currentData.filter((product: Product) => 
      !previousProducts.has(`${product.titulo}-${product.precio}`)
    );

    const resultsData: ResultsData = {
      previousResults: {
        date: getDateFromFilename(previousFile || ''),
        count: previousData?.length || 0
      },
      currentResults: {
        date: getDateFromFilename(currentFile),
        count: currentData.length
      },
      newProducts
    };

    return NextResponse.json(resultsData);
  } catch (error) {
    console.error('Error al leer los resultados:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener resultados' }, 
      { status: 500 }
    );
  }
} 