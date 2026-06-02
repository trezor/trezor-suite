import cors, { type CorsOptions } from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';

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

const GOOGLE_OAUTH_LOOPBACK_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]'] as const;
const GOOGLE_OAUTH_LOOPBACK_PORT = '21335';
const GOOGLE_OAUTH_LOOPBACK_PATHNAME = '/oauth';
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS_PER_IP = 100;

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
 * Only allow loopback OAuth receiver (redirect URI) for Trezor Suite, which is expected to be 127.0.0.1:21335/oauth
 */
const isGoogleOAuthRedirectUriValid = (redirectUri: unknown): boolean => {
    if (typeof redirectUri !== 'string' || !URL.canParse(redirectUri)) return false;

    const parsedRedirectUri = new URL(redirectUri);

    return (
        parsedRedirectUri.protocol === 'http:' &&
        GOOGLE_OAUTH_LOOPBACK_HOSTNAMES.some(hostname => hostname === parsedRedirectUri.hostname) &&
        parsedRedirectUri.port === GOOGLE_OAUTH_LOOPBACK_PORT &&
        parsedRedirectUri.pathname === GOOGLE_OAUTH_LOOPBACK_PATHNAME &&
        parsedRedirectUri.username === '' &&
        parsedRedirectUri.password === '' &&
        parsedRedirectUri.search === '' &&
        parsedRedirectUri.hash === ''
    );
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

app.use(
    rateLimit({
        windowMs: RATE_LIMIT_WINDOW_MS,
        limit: RATE_LIMIT_MAX_REQUESTS_PER_IP,
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Too many requests.',
    }),
);

/**
 * Exchange authorization code for refresh token and access token.
 */
app.post('/google-oauth-init', async (req, res) => {
    const redirectUri = req.body?.redirectUri;

    if (!isGoogleOAuthRedirectUriValid(redirectUri)) {
        res.status(400).json('Invalid request body.');

        return;
    }

    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            body: JSON.stringify({
                code: req.body.code,
                client_secret: GOOGLE_CLIENT_SECRET,
                client_id: req.body.clientId,
                redirect_uri: redirectUri,
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
