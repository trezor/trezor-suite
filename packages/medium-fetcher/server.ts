import express, { Application } from 'express';
import fetcher from './src';

const app: Application = express();
const PORT = process.env.PORT || 3003;

app.get('/', (_req, res) => {
    fetcher((_status, data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(data);
    });
});

app.listen(PORT, () => {
    console.log(`>>> Server listening on http://localhost:${PORT}`);
});
