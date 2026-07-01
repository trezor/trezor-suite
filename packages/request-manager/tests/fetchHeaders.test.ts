import { buildTorHeaders, getHeaderValue } from '../src/interceptor/fetchHeaders';

// `buildTorHeaders` is the fetch-path guard that must never let the Tor identity
// (`Proxy-Authorization`) or the internal `Allowed-Headers` routing header reach the destination
// server. It is a pure function, so it is tested deterministically here (no Tor / no network),
// unlike the e2e `Allowed-Headers` suite which — because it targets a whitelisted localhost — runs
// the DIRECT path and only exercises the legacy socket-level stripping.
describe('fetchHeaders', () => {
    describe('buildTorHeaders', () => {
        it('always strips the internal control headers (Proxy-Authorization, Allowed-Headers)', () => {
            // The control headers are even added to the allow-list, so ONLY the dedicated strip step
            // (not the allow-list filter) can remove them — this isolates that the strip actually runs.
            const result = buildTorHeaders({
                'Proxy-Authorization': 'Basic secret-identity',
                'Allowed-Headers': 'Proxy-Authorization;Allowed-Headers;Content-Type',
                'Content-Type': 'application/json',
            });

            expect(result).not.toHaveProperty('proxy-authorization');
            expect(result).not.toHaveProperty('allowed-headers');
            expect(result).toEqual({ 'content-type': 'application/json' });
        });

        it('strips the identity header even when no allow-list is present', () => {
            const result = buildTorHeaders({
                'proxy-authorization': 'Basic secret-identity',
                'user-agent': 'Trezor Suite',
            });

            expect(result).not.toHaveProperty('proxy-authorization');
            expect(result).toEqual({ 'user-agent': 'Trezor Suite' });
        });

        it('keeps only allow-listed headers when Allowed-Headers is present (case-insensitive prefix)', () => {
            const result = buildTorHeaders({
                'Proxy-Authorization': 'Basic id',
                'Allowed-Headers': 'AcCePt-EnCoDiNg;content-type;Content-Length;HOST', // case insensitive
                'Accept-Encoding': 'gzip',
                'Content-Type': 'application/json',
                'Content-Length': '15',
                Host: 'example.com',
                'User-Agent': 'Trezor Suite', // not allow-listed -> dropped (anti-fingerprinting)
            });

            expect(result).toEqual({
                'accept-encoding': 'gzip',
                'content-type': 'application/json',
                'content-length': '15',
                host: 'example.com',
            });
            expect(result).not.toHaveProperty('user-agent');
            expect(result).not.toHaveProperty('proxy-authorization');
        });

        it('forwards all non-control headers when no Allowed-Headers is present', () => {
            const result = buildTorHeaders({
                'Content-Type': 'application/json',
                'User-Agent': 'Trezor Suite',
            });

            expect(result).toEqual({
                'content-type': 'application/json',
                'user-agent': 'Trezor Suite',
            });
        });

        it('returns an empty object when there are no headers', () => {
            expect(buildTorHeaders()).toEqual({});
            expect(buildTorHeaders(undefined)).toEqual({});
        });
    });

    describe('getHeaderValue', () => {
        it('reads a header case-insensitively', () => {
            expect(
                getHeaderValue({ 'Proxy-Authorization': 'Basic x' }, 'proxy-authorization'),
            ).toBe('Basic x');
            expect(
                getHeaderValue({ 'proxy-authorization': 'Basic x' }, 'Proxy-Authorization'),
            ).toBe('Basic x');
        });

        it('returns undefined for a missing header or no headers', () => {
            expect(getHeaderValue({ 'Content-Type': 'x' }, 'Proxy-Authorization')).toBeUndefined();
            expect(getHeaderValue(undefined, 'Proxy-Authorization')).toBeUndefined();
        });
    });
});
