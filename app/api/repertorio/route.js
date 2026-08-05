import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data/repertorio.json');

export async function GET() {
  try {
    const fileData = fs.readFileSync(filePath, 'utf8');
    return NextResponse.json(JSON.parse(fileData));
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo leer el repertorio' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const newData = await request.json();
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');
    return NextResponse.json({ success: true, message: 'Actualizado localmente' });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 });
  }
}
