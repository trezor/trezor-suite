import express, { Application } from 'express';
import fetcher from './index';
import { Post } from './types';
import pkg from '../package.json';
import childProcess from 'child_process';

const app: Application = express();
const PORT = process.env.PORT || 3003;

app.get('/', (_req, res) => {
    res.send('welcome welcome welcome medium fetcher api welcome welcome');
});

app.get('/data', (_req, res) => {
    fetcher((statusCode, data: string | null, errorMsg) => {
        res.setHeader('Content-Type', 'application/json');
        if (statusCode !== 200) {
            res.end(JSON.stringify({ status: 'error', errorMsg }));
        } else {
            res.end(data);
        }
    });
});

app.get('/status', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
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
