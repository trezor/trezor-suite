import cors, { type CorsOptions } from 'cors';
import express, { type ErrorRequestHandler } from 'express';

const app = express();

app.use(express.json());

const corsOptions: CorsOptions = {
    origin: [
        'https://suite.trezor.io', // production web
        /\.sldev\.cz$/, // staging web
        'http://localhost:8000', // development web
        'http://trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion', // onion address for production web (Suite does not work here now)
    ],
};
app.use(cors(corsOptions));

const PORT = process.env.PORT || 3005;
const { GOOGLE_CLIENT_SECRET } = process.env; // generate testing credentials for development

const checkResponse = (responseBody: object, expectedProperties: string[]) => {
    expectedProperties.forEach(property => {
        if (!Object.prototype.hasOwnProperty.call(responseBody, property)) {
            throw new Error('Unexpected response from authentication server.');
        }
    });
};

const getErrorStatusCode = (error: unknown): number => {
    if (typeof error !== 'object' || error === null) return 500;
    if ('status' in error && typeof error.status === 'number') return error.status;
    if ('statusCode' in error && typeof error.statusCode === 'number') return error.statusCode;

    return 500;
};

const sanitizeExpressError: ErrorRequestHandler = (error, _req, res, next) => {
    // Once headers are sent, the server can no longer safely change the response body.
    if (res.headersSent) {
        next(error);

        return;
    }

    const statusCode = getErrorStatusCode(error);

    if (statusCode === 400) {
        res.status(statusCode).json('Invalid request body.');

        return;
    }

    if (statusCode === 401) {
        res.status(statusCode).json('Authentication failed.');

        return;
    }

    res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json('Request failed.');
};

/**
 * Root URL should return 200 for health check.
 */
app.get('/', (_req, res) => {
    res.send();
});

/**
 * Is server alive?
 */
app.get('/status', (_req, res) => {
    res.send({ status: 'ok' });
});

/**
 * Exchange authorization code for refresh token and access token.
 */
app.post('/google-oauth-init', async (req, res) => {
    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            body: JSON.stringify({
                code: req.body.code,
                client_secret: GOOGLE_CLIENT_SECRET,
                client_id: req.body.clientId,
                redirect_uri: req.body.redirectUri,
                grant_type: 'authorization_code',
                code_verifier: req.body.codeVerifier,
            }),
            method: 'POST',
        });
        const json = await response.json();
        checkResponse(json, ['refresh_token', 'access_token']);
        res.status(response.status).send(json);
    } catch {
        res.status(401).json('Authorization failed.');
    }
});

/**
 * Refresh access token.
 */
app.post('/google-oauth-refresh', async (req, res) => {
    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            body: JSON.stringify({
                refresh_token: req.body.refreshToken,
                grant_type: 'refresh_token',
                client_secret: GOOGLE_CLIENT_SECRET,
                client_id: req.body.clientId,
            }),
            method: 'POST',
        });
        const json = await response.json();
        checkResponse(json, ['access_token']);
        res.status(response.status).send(json);
    } catch {
        res.status(401).json('Refresh failed.');
    }
});

app.use(sanitizeExpressError);

app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`OAuth app listening on port ${PORT}`);
});
