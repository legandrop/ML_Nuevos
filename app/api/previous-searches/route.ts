import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'src/backend/scripts/data');
    const files = fs.readdirSync(dataDir);
    
    // Filtrar solo archivos JSON y extraer los términos de búsqueda
    const searches = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        // Eliminar la extensión .json y la fecha
        const searchTerm = file
          .replace(/\_\d{8}\_\d{6}\.json$/, '') // Elimina el patrón de fecha y extensión
          .replace(/\_/g, ' '); // Reemplaza guiones bajos por espacios
        
        return searchTerm;
      });

    return NextResponse.json(searches);
  } catch (error) {
    console.error('Error al leer los archivos:', error);
    return NextResponse.json({ error: 'Error al cargar búsquedas previas' }, { status: 500 });
  }
} 