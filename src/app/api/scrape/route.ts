import { spawn } from 'child_process';
import { NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { searchTerm } = await request.json();
    
    // Asegurarse de que el script de Python existe
    const pythonScript = path.join(process.cwd(), 'src', 'backend', 'scripts', 'LGA_Scrapper.py');
    if (!require('fs').existsSync(pythonScript)) {
      throw new Error('Script de Python no encontrado');
    }

    const pythonProcess = spawn('python3', [pythonScript, searchTerm], {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, 'PYTHONUNBUFFERED': '1' }
    });

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    let buffer = '';

    pythonProcess.stdout.on('data', (data) => {
      const text = data.toString();
      buffer += text;
      
      // Si el buffer contiene una línea completa
      if (buffer.includes('\n')) {
        const lines = buffer.split('\n');
        // Mantenemos la última línea incompleta en el buffer
        buffer = lines.pop() || '';
        
        let skipNext = false;
        
        for (let i = 0; i < lines.length; i++) {
          if (skipNext) {
            skipNext = false;
            continue;
          }
          
          const currentLine = lines[i];
          const nextLine = lines[i + 1];
          
          // Si la línea actual y la siguiente están vacías, envía un solo salto
          if (currentLine === '' && nextLine === '') {
            writer.write(new TextEncoder().encode(`data: \n`));
            skipNext = true;
          } else if (currentLine.trim() || currentLine === '') {
            // Si no es un doble salto, envía la línea sin salto adicional
            writer.write(new TextEncoder().encode(`data: ${currentLine}`));
          }
        }
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error('Python stderr:', data.toString());
      writer.write(new TextEncoder().encode(`data: Error: ${data}`));
    });

    pythonProcess.on('error', (error) => {
      console.error('Process error:', error);
      writer.write(new TextEncoder().encode(`data: Error al ejecutar el script: ${error}`));
    });

    pythonProcess.on('close', (code) => {
      // Enviamos cualquier dato restante en el buffer
      if (buffer.trim()) {
        writer.write(new TextEncoder().encode(`data: ${buffer}`));
      }
      writer.close();
    });

    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in route handler:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error processing request' }, { status: 500 });
  }
} 