import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function DELETE(request: Request) {
  try {
    const { searchTerm } = await request.json();
    const dataDir = path.join(process.cwd(), 'src', 'backend', 'data');
    const deletedFiles = [];
    
    // Leer todos los archivos en el directorio
    const files = fs.readdirSync(dataDir);
    
    // Normalizar el término de búsqueda para la comparación
    const normalizedSearchTerm = searchTerm
      .toLowerCase()
      .replace(/ /g, '_');
    
    // Filtrar y eliminar los archivos que coincidan con el término de búsqueda
    files.forEach(file => {
      if (file.toLowerCase().includes(normalizedSearchTerm)) {
        const filePath = path.join(dataDir, file);
        fs.unlinkSync(filePath);
        deletedFiles.push(file);
      }
    });

    if (deletedFiles.length === 0) {
      return NextResponse.json({ 
        success: false,
        message: 'No se encontraron archivos para eliminar',
        deletedFiles: [] 
      });
    }

    return NextResponse.json({ 
      success: true,
      message: `Se eliminaron ${deletedFiles.length} archivos`,
      deletedFiles 
    });
  } catch (error) {
    console.error('Error al eliminar archivos:', error);
    return NextResponse.json(
      { 
        error: 'Error al eliminar los archivos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 