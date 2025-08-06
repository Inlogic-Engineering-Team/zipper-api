require('dotenv').config();

const express = require('express');
const fs = require('fs');
const archiver = require('archiver');
const os = require('os');
const path = require('path');

const app = express();
app.use(express.json({ limit: '2mb' }));

app.post('/zip', async (req, res) => {
    const userKey = req.headers['x-api-key'];
    if (userKey !== process.env.ZIPPER_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

  try {
    const { functionName, code } = req.body;
    if (!functionName || !code) return res.status(400).json({ error: 'Missing fields' });

    // Create a temp directory
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zipper-'));
    const fnDir = path.join(tmpDir, functionName);
    fs.mkdirSync(fnDir);

    // Write the index.ts file
    fs.writeFileSync(path.join(fnDir, 'index.ts'), code);

    // Zip the folder
    const archive = archiver('zip');
    res.attachment(functionName + '.zip');

    archive.directory(fnDir, functionName);
    archive.finalize();
    archive.pipe(res);

    archive.on('end', () => fs.rmSync(tmpDir, { recursive: true, force: true }));
    archive.on('error', err => { throw err; });

  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.listen(3000, () => console.log('Zipper API running on port 3000'));

