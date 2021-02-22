import { CaptureConsole } from '@sentry/integrations';
import { BrowserOptions } from '@sentry/browser';
import { TOR_DOMAIN } from '@suite-constants/urls';

const fiatRatesRe = new RegExp(`FiatRatesFetchError.*${TOR_DOMAIN}`, 'gmi');

export default {
    dsn: 'https://6d91ca6e6a5d4de7b47989455858b5f6@o117836.ingest.sentry.io/5193825',
    normalizeDepth: 10,
    integrations: [
        new CaptureConsole({
            levels: ['error'],
        }),
    ],
    release: process.env.COMMITHASH,
    environment: process.env.SUITE_TYPE,
    beforeSend(event, hint) {
        const error = hint?.syntheticException;
        if (error?.message?.match(fiatRatesRe)) {
            // discard failed fiat rate fetch on TOR
            event.fingerprint = ['FiatRatesFetchError'];
            return null;
        }
    },
} as BrowserOptions;
