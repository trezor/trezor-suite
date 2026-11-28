/**
 * Chromium delays every new WebSocket of a renderer process exponentially by the number of its sockets
 * still in their handshake (about 1–5 s each at 16 or more), workers included,
 * and lets only one socket per IP and port connect at a time.
 * The *.trezor.io backends share their IPs, so opening them all at once
 * only makes every socket wait for the throttle.
 */
export const BACKEND_CONNECT_LIMIT = 8;
