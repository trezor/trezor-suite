// A Tor request can fail because the underlying SOCKS circuit misbehaves — the proxy refused the
// connection, the exit closed the socket, auth was rejected, and so on. Those failures should reset
// the circuit and retry, but they surface with different shapes depending on the transport:
//
// - legacy `http`/`https` module + `socks-proxy-agent`: a `SocksClientError` from the `socks`
//   package, which carries an `options` field; a reset socket has `code: 'ECONNRESET'`.
// - native `fetch` (undici): a generic `TypeError: fetch failed` whose underlying error is on
//   `cause`. undici ships its OWN SOCKS5 client (it does not use the `socks` package), so a closed
//   socket is `code: 'UND_ERR_SOCKET'` ("other side closed") and SOCKS5 connect/auth failures are
//   `code: 'UND_ERR_SOCKS5_*'` — none of them carry an `options` field or `ECONNRESET`.
//
// Recognising all of these keeps circuit recovery working regardless of which transport ran the
// request. This is the single source of truth for "is this a misbehaving Tor circuit?"; keep it in
// sync with the equivalent check in @trezor/coinjoin `coordinatorRequest` (which cannot import from
// this package).

const CIRCUIT_ERROR_CODES = ['ECONNRESET', 'UND_ERR_SOCKET'];

const isCircuitErrorCandidate = (candidate: unknown): boolean => {
    if (typeof candidate !== 'object' || candidate === null) {
        return false;
    }

    // `socks` package SocksClientError (legacy http path / node-fetch)
    if ('options' in candidate) {
        return true;
    }

    if ('code' in candidate) {
        const { code } = candidate as { code?: unknown };
        if (typeof code === 'string') {
            return CIRCUIT_ERROR_CODES.includes(code) || code.startsWith('UND_ERR_SOCKS5');
        }
    }

    return false;
};

// undici wraps connection failures in a generic error and exposes the underlying error on `cause`,
// so both the error itself and its cause are inspected.
export const isTorCircuitError = (error: unknown): boolean => {
    const cause =
        typeof error === 'object' && error !== null && 'cause' in error
            ? (error as { cause: unknown }).cause
            : undefined;

    return [error, cause].some(isCircuitErrorCandidate);
};
