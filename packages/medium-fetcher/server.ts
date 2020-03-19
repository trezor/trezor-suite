import express, { Application } from 'express';
import fetchFeedData from './src';

const app: Application = express();
const PORT = process.env.PORT || 3003;

app.get('/', (_req, res) => {
    fetchFeedData(data => {
        res.end(data, 'utf-8');
    });
});

app.listen(PORT, () => {
    console.log(`>>> Server listening on http://localhost:${PORT}`);
});
