import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const configPath = path.join(process.cwd(), 'config', 'config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    return Response.json(config);
  } catch (error) {
    return Response.json({ error: 'Failed to load config' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const newConfig = await req.json();
    const configPath = path.join(process.cwd(), 'config', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Failed to save config' }, { status: 500 });
  }
}