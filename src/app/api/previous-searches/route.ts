import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'src/backend/data');
    const files = fs.readdirSync(dataDir);
    
    // Filtrar archivos JSON y extraer términos de búsqueda únicos
    const uniqueSearches = new Set(
      files
        .filter(file => file.endsWith('.json'))
        .map(file => {
          // Eliminar la extensión .json y la fecha
          return file
            .replace(/\_\d{8}\_\d{6}\.json$/, '') // Elimina el patrón de fecha y extensión
            .replace(/\_/g, ' '); // Reemplaza guiones bajos por espacios
        })
    );

    // Convertir el Set a Array y ordenar alfabéticamente
    const searches = Array.from(uniqueSearches).sort();

    return NextResponse.json(searches);
  } catch (error) {
    console.error('Error al leer los archivos:', error);
    return NextResponse.json({ error: 'Error al cargar búsquedas previas' }, { status: 500 });
  }
} 