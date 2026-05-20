import { type NetworkSymbol } from '@suite-common/wallet-config';

export const COINBASE_WS_URL = 'wss://ws-feed.exchange.coinbase.com';
export const COINBASE_LIVE_WINDOW_SECONDS = 60;
export const COINBASE_LIVE_EMA_ALPHA = 0.1;

export type CoinbaseLivePriceTick = {
    time: number;
    price: number;
};

export type CoinbaseTickerTick = CoinbaseLivePriceTick & {
    productId: string;
};

const COINBASE_PRODUCT_IDS: Partial<Record<NetworkSymbol, string>> = {
    btc: 'BTC-USD',
    eth: 'ETH-USD',
    ltc: 'LTC-USD',
    doge: 'DOGE-USD',
    etc: 'ETC-USD',
    xrp: 'XRP-USD',
    sol: 'SOL-USD',
    ada: 'ADA-USD',
    xlm: 'XLM-USD',
    pol: 'MATIC-USD',
    avax: 'AVAX-USD',
    arb: 'ETH-USD',
    base: 'ETH-USD',
    op: 'ETH-USD',
};

export const getCoinbaseProductId = (symbol: NetworkSymbol): string | undefined =>
    COINBASE_PRODUCT_IDS[symbol];

export const smoothCoinbaseLivePriceTicks = (
    ticks: CoinbaseLivePriceTick[],
    alpha = COINBASE_LIVE_EMA_ALPHA,
): CoinbaseLivePriceTick[] => {
    if (ticks.length <= 1) {
        return ticks;
    }

    const smoothed: CoinbaseLivePriceTick[] = [ticks[0]];
    let ema = ticks[0].price;

    for (let index = 1; index < ticks.length; index++) {
        ema = alpha * ticks[index].price + (1 - alpha) * ema;
        smoothed.push({
            time: ticks[index].time,
            price: ema,
        });
    }

    return smoothed;
};

export const trimCoinbaseLivePriceHistory = (
    history: CoinbaseLivePriceTick[],
    cutoffTime: number,
): CoinbaseLivePriceTick[] => {
    if (history.length <= 1) {
        return history;
    }

    const firstPointInWindowIndex = history.findIndex(point => point.time >= cutoffTime);

    if (firstPointInWindowIndex === -1) {
        return [history[history.length - 1]];
    }

    if (firstPointInWindowIndex === 0) {
        return history;
    }

    return history.slice(firstPointInWindowIndex - 1);
};

type CoinbaseTickerStreamParams = {
    productIds: string[];
    onTick: (tick: CoinbaseTickerTick) => void;
    onDisconnect?: () => void;
};

export const createCoinbaseTickerStream = ({
    productIds,
    onTick,
    onDisconnect,
}: CoinbaseTickerStreamParams) => {
    let isClosed = false;
    let websocket: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const subscribeMessage = JSON.stringify({
        type: 'subscribe',
        product_ids: productIds,
        channels: ['ticker'],
    });

    const clearReconnectTimeout = () => {
        if (reconnectTimeout !== null) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
    };

    const connect = () => {
        if (isClosed) {
            return;
        }

        websocket = new WebSocket(COINBASE_WS_URL);

        websocket.onopen = () => {
            websocket?.send(subscribeMessage);
        };

        websocket.onmessage = event => {
            let message;
            try {
                message = JSON.parse(event.data as string);
            } catch {
                return;
            }

            if (
                message.type !== 'ticker' ||
                !message.price ||
                !message.time ||
                !message.product_id
            ) {
                return;
            }

            onTick({
                productId: message.product_id as string,
                price: parseFloat(message.price),
                time: new Date(message.time).getTime() / 1000,
            });
        };

        websocket.onerror = () => {
            websocket?.close();
        };

        websocket.onclose = event => {
            websocket = null;
            if (isClosed) {
                return;
            }

            onDisconnect?.();

            if (!event.wasClean) {
                reconnectTimeout = setTimeout(connect, 3000);
            }
        };
    };

    connect();

    return {
        close: () => {
            isClosed = true;
            clearReconnectTimeout();
            websocket?.close();
            websocket = null;
        },
    };
};
