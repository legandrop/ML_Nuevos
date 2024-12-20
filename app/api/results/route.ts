import { NextResponse } from 'next/server';
import fs from 'fs';
import { glob } from 'glob';
import path from 'path';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    
    // Crear el directorio si no existe
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    // Buscar el archivo JSON más reciente en la carpeta data
    const pattern = path.join(dataDir, '*.json');
    const files = glob.sync(pattern);
    
    if (files.length === 0) {
      return NextResponse.json({ error: 'No hay resultados disponibles' }, { status: 404 });
    }

    // Ordenar por fecha de modificación (más reciente primero)
    const mostRecentFile = files.sort((a, b) => {
      return fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime();
    })[0];

    // Leer el contenido del archivo
    const fileContent = fs.readFileSync(mostRecentFile, 'utf-8');
    const data = JSON.parse(fileContent);

    // Verificar que data sea un array
    if (!Array.isArray(data)) {
      throw new Error('El archivo JSON no contiene un array de productos');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al leer los resultados:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener resultados' }, 
      { status: 500 }
    );
  }
} 