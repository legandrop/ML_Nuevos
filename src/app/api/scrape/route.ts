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

    const encoder = new TextEncoder();
    const stream = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
      }
    });

    const writer = stream.writable.getWriter();

    pythonProcess.stdout.on('data', (data) => {
      writer.write(`${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error('Python stderr:', data.toString());
      writer.write(new TextEncoder().encode(`data: Error: ${data}\n\n`));
    });

    pythonProcess.on('error', (error) => {
      console.error('Process error:', error);
      writer.write(new TextEncoder().encode(`data: Error al ejecutar el script: ${error}\n\n`));
    });

    pythonProcess.on('close', (code) => {
      console.log('Process exited with code:', code);
      if (code !== 0) {
        writer.write(new TextEncoder().encode(`data: El proceso terminó con código de error: ${code}\n\n`));
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