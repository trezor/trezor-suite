import express, { Application } from 'express';
import fetcher from './index';
import pkg from '../package.json';
import childProcess from 'child_process';

const app: Application = express();
const PORT = process.env.PORT || 3003;

app.get('/', (_req, res) => {
    fetcher((_status, data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(data);
    });
});

app.get('/status', (_req, res) => {
    const revision = childProcess
        .execSync('git rev-parse HEAD')
        .toString()
        .trim();

    res.end(
        JSON.stringify({ status: 'OK', app: pkg.name, version: pkg.version, commit: revision }),
    );
});

app.listen(PORT, () => {
    console.log(`>>> Server listening on http://localhost:${PORT}`);
});
