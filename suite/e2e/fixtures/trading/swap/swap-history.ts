// Seeded trade data for swap history E2E tests.
// We intentionally provide three exchanges with different final/ongoing statuses
// so the history list shows Approved + Rejected + Pending states.

export type SwapHistoryItem = {
    orderId: string;
    date: string;
    sendSymbol: string;
    data: {
        exchange: string;
        orderId: string;
        status: string;
        send: string;
        sendAddress: string;
        sendStringAmount: string;
        receive: string;
        receiveAddress: string;
        receiveStringAmount: string;
        statusUrl: string;
    };
};

// Successful swap: Ethereum → Bitcoin via Changelly
export const SUCCESS_TRADE: SwapHistoryItem = {
    orderId: '1017bde774cfdf577ace',
    date: '2025-12-17T15:16:41.156Z',
    sendSymbol: 'eth',
    data: {
        exchange: 'changelly',
        orderId: '1017bde774cfdf577ace',
        status: 'SUCCESS',
        send: 'ethereum',
        sendAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        sendStringAmount: '0.5',
        receive: 'bitcoin',
        receiveAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        receiveStringAmount: '0.00265848',
        statusUrl: 'https://changelly.io/transaction/1017bde774cfdf577ace',
    },
} as const;

// Failed swap: Litecoin → Ethereum via ChangeNow
export const FAILED_TRADE: SwapHistoryItem = {
    orderId: 'f4a2c1e9b3d07e5f6a8b',
    date: '2025-12-16T08:30:00.000Z',
    sendSymbol: 'ltc',
    data: {
        exchange: 'changenow',
        orderId: 'f4a2c1e9b3d07e5f6a8b',
        status: 'ERROR',
        send: 'litecoin',
        sendAddress: 'LcDpKhDmqCWigwRMBFcgVPbNfzjmCVWHPb',
        sendStringAmount: '12',
        receive: 'ethereum',
        receiveAddress: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72',
        receiveStringAmount: '5.12345678',
        statusUrl: 'https://changenow.io/exchange/txs/f4a2c1e9b3d07e5f6a8b',
    },
} as const;

// Pending swap: Bitcoin → Litecoin via SideShift
export const PENDING_TRADE: SwapHistoryItem = {
    orderId: 'a3c5e7f9b1d2e4f60789',
    date: '2025-12-15T12:00:00.000Z',
    sendSymbol: 'btc',
    data: {
        exchange: 'sideshift',
        orderId: 'a3c5e7f9b1d2e4f60789',
        status: 'CONFIRMING',
        send: 'bitcoin',
        sendAddress: '3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5',
        sendStringAmount: '0.00050000',
        receive: 'litecoin',
        receiveAddress: 'LcDpKhDmqCWigwRMBFcgVPbNfzjmCVWHPb',
        receiveStringAmount: '0.35',
        statusUrl: 'https://sideshift.ai/orders/a3c5e7f9b1d2e4f60789',
    },
} as const;

// `sendSymbol` is the network symbol (as stored in wallet accounts)
// corresponding to the Invity `send` crypto ID. It is used to look up the
// correct `sendAccountKey` when seeding trades into Redux.
export const SEEDED_TRADES = [SUCCESS_TRADE, FAILED_TRADE, PENDING_TRADE];
