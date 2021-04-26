import express, { Application } from 'express';
import fetcher from './index';
import cors from 'cors';
import pkg from '../package.json';
import childProcess from 'child_process';

const app: Application = express();
const PORT = process.env.PORT || 3003;

const options: cors.CorsOptions = {
    origin: '*',
};

const invalidLimitRes = JSON.stringify({
    status: 'error',
    errorMsg: 'Invalid limit param',
});

app.use(cors(options));

app.get('/', (_req, res) => {
    res.send(`trezor news api`);
});

app.get('/posts', (req, res) => {
    let limitCount;
    const { limit } = req.query;

    if (limit) {
        if (typeof limit !== 'string') {
            return res.status(400).end(invalidLimitRes);
        }
        limitCount = parseInt(limit, 10);
        if (Number.isNaN(limitCount)) {
            return res.status(400).end(invalidLimitRes);
        }
    }

    fetcher((statusCode, data: string | null, errorMsg) => {
        res.setHeader('Content-Type', 'application/json');
        if (statusCode !== 200) {
            res.statusCode = statusCode;
            res.end(JSON.stringify({ status: 'error', errorMsg }));
        } else {
            res.end(data);
        }
    }, limitCount);
});

app.get('/status', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const revision = childProcess.execSync('git rev-parse HEAD').toString().trim();

    res.end(
        JSON.stringify({ status: 'OK', app: pkg.name, version: pkg.version, commit: revision }),
    );
});

app.listen(PORT, () => {
    console.log(`>>> Server listening on http://localhost:${PORT}`);
});
