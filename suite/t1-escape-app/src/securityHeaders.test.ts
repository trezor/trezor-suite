import {
    BLOCKBOOK_ORIGINS,
    BRIDGE_ORIGIN,
    CONTENT_SECURITY_POLICY,
    PRODUCTION_SECURITY_HEADERS,
} from '../securityHeaders';
import { BLOCKBOOK_URLS } from './bitcoin/bitcoinNetwork';
import { ETHEREUM_BLOCKBOOK_URLS } from './ethereum/ethereumChain';

describe('production security headers', () => {
    it('allows connections to exactly the blockbook hosts the app uses', () => {
        // The blockbook client turns its https URLs into WebSocket URLs on the same host.
        expect(BLOCKBOOK_ORIGINS).toEqual(
            [...BLOCKBOOK_URLS, ...ETHEREUM_BLOCKBOOK_URLS].map(url => url.replace(/^http/, 'ws')),
        );
    });

    it('allows connections to the bridge and blockbook and to nothing else', () => {
        expect(CONTENT_SECURITY_POLICY).toContain(
            `connect-src ${BRIDGE_ORIGIN} wss://btc.trezor.io wss://eth.trezor.io wss://etc.trezor.io;`,
        );
    });

    it('loads scripts from the own origin only and cannot be framed', () => {
        expect(CONTENT_SECURITY_POLICY.split('; ')).toEqual(
            expect.arrayContaining([
                "default-src 'self'",
                "script-src 'self'",
                "worker-src 'self'",
                "object-src 'none'",
                "frame-ancestors 'none'",
            ]),
        );
    });

    it('keeps WebUSB and WebHID switched off', () => {
        expect(PRODUCTION_SECURITY_HEADERS['Permissions-Policy']).toBe(
            'local-network-access=(self), usb=(), hid=()',
        );
    });
});
