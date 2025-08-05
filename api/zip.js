import archiver from 'archiver';
import fs from 'fs';
import os from 'os';
import path from 'path';

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');
  try {
    const { functionName, code } = req.body;
    if (!functionName || !code) return res.status(400).json({ error: 'Missing fields' });

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zipper-'));
    const fnDir = path.join(tmpDir, functionName);
    fs.mkdirSync(fnDir, { recursive: true });
    fs.writeFileSync(path.join(fnDir, 'index.ts'), code);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${functionName}.zip`);
    const archive = archiver('zip');
    archive.directory(fnDir, functionName);
    archive.finalize();
    archive.pipe(res);

    archive.on('end', () => fs.rmSync(tmpDir, { recursive: true, force: true }));
    archive.on('error', err => { throw err; });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
};
