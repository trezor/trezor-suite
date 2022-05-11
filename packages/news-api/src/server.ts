import express, { Application } from 'express';
import cors from 'cors';
import childProcess from 'child_process';

import pkg from '../package.json';

const app: Application = express();
const PORT = process.env.PORT || 3003;

const options: cors.CorsOptions = {
    origin: '*',
};

app.use(cors(options));

app.get('/', (_, res) => {
    res.send(`Deprecated Trezor news api.`);
});

app.get('/posts', (_, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify([]));
});

app.get('/status', (_req, res) => {
    const revision = childProcess.execSync('git rev-parse HEAD').toString().trim();

    res.setHeader('Content-Type', 'application/json');
    res.end(
        JSON.stringify({ status: 'OK', app: pkg.name, version: pkg.version, commit: revision }),
    );
});

app.get('*', (_req, res) => {
    res.send(`Not found. Deprecated Trezor news api.`);
});

app.listen(PORT, () => {
    console.log(`>>> Server listening on http://localhost:${PORT}`);
});
