import type { CryptoId, ExchangeProviderInfo, ExchangeTrade, InfoResponse } from 'invity-api';
import http from 'node:http';

const usdcContract = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const usdcCryptoId = `ethereum--${usdcContract}` as CryptoId;
const usdtCryptoId = 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId;
const spender = '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae';
const revokeData = `0x095ea7b3${spender.slice(2).padStart(64, '0')}${'0'.repeat(64)}`;

const provider: ExchangeProviderInfo = {
    name: 'lifi',
    companyName: 'LI.FI',
    logo: 'lifi.svg',
    isActive: true,
    isDex: true,
    isFixedRate: false,
    buyTickers: [usdcCryptoId, usdtCryptoId],
    sellTickers: [usdcCryptoId, usdtCryptoId],
    addressFormats: {},
    kycPolicyType: 'DEX',
    supportUrl: 'http://localhost:3330',
};

const info: InfoResponse = {
    platforms: { ethereum: { id: 'ethereum', name: 'Ethereum', nativeCoinSymbol: 'eth' } },
    coins: {
        ethereum: {
            symbol: 'eth',
            name: 'Ethereum',
            coingeckoId: 'ethereum',
            services: { buy: false, sell: false, exchange: true },
        },
        [usdcCryptoId]: {
            symbol: 'usdc',
            name: 'USD Coin',
            coingeckoId: 'usd-coin',
            services: { buy: false, sell: false, exchange: true },
        },
        [usdtCryptoId]: {
            symbol: 'usdt',
            name: 'Tether',
            coingeckoId: 'tether',
            services: { buy: false, sell: false, exchange: true },
        },
    },
    config: { btcSwapComposeTemplate: { extraOutputs: [] } },
};

const createQuote = (fromAddress: string): ExchangeTrade => ({
    exchange: provider.name,
    isDex: true,
    quoteId: 'e2e-lifi-revoke',
    orderId: 'e2e-lifi-revoke-order',
    send: usdcCryptoId,
    receive: usdtCryptoId,
    sendStringAmount: '6',
    receiveStringAmount: '6',
    fromAddress,
    rate: 1,
    min: 0,
    max: 'NONE',
    fee: 'UNKNOWN',
    swapSlippage: '1',
});

type QuoteRequest = {
    send?: string;
    receive?: string;
    sendStringAmount?: string;
    fromAddress?: string;
    trade?: ExchangeTrade;
};

const readRequest = async (request: http.IncomingMessage): Promise<QuoteRequest> => {
    let body = '';
    for await (const chunk of request) {
        body += chunk;
        if (body.length > 64 * 1024) {
            throw new Error('Fixture request too large');
        }
    }

    return JSON.parse(body);
};

export class DexRevokeTradingServer {
    readonly port = 3330;
    private server?: http.Server;

    async start(): Promise<void> {
        if (this.server?.listening) return;

        const server = http.createServer((request, response) => {
            void this.handleRequest(request, response);
        });
        this.server = server;

        await new Promise<void>((resolve, reject) => {
            server.once('error', reject);
            server.listen(this.port, '127.0.0.1', resolve);
        });
    }

    get url() {
        return `http://localhost:${this.port}`;
    }

    private async handleRequest(request: http.IncomingMessage, response: http.ServerResponse) {
        response.setHeader('Content-Type', 'application/json');
        const route = `${request.method} ${request.url}`;

        if (route === 'GET /api/info') {
            response.end(JSON.stringify(info));

            return;
        }

        if (route === 'GET /api/v3/exchange/list') {
            response.end(JSON.stringify([provider]));

            return;
        }

        if (route === 'GET /api/v3/buy/list' || route === 'GET /api/v3/sell/list') {
            response.end('[]');

            return;
        }

        if (route !== 'POST /api/v3/exchange/quotes' && route !== 'POST /api/v3/exchange/trade') {
            response.writeHead(404);
            response.end(JSON.stringify({ error: 'Unsupported fixture endpoint' }));

            return;
        }

        try {
            const body = await readRequest(request);
            const quoteRequest = route === 'POST /api/v3/exchange/quotes' ? body : body.trade;
            if (
                quoteRequest?.send !== usdcCryptoId ||
                quoteRequest.receive !== usdtCryptoId ||
                quoteRequest.sendStringAmount !== '6' ||
                typeof quoteRequest.fromAddress !== 'string' ||
                !/^0x[0-9a-f]{40}$/i.test(quoteRequest.fromAddress)
            ) {
                response.writeHead(400);
                response.end(JSON.stringify({ error: 'Unsupported fixture quote' }));

                return;
            }

            const quote = createQuote(quoteRequest.fromAddress);
            if (route === 'POST /api/v3/exchange/quotes') {
                response.end(JSON.stringify([quote]));

                return;
            }

            const trade: ExchangeTrade = {
                ...quote,
                // The revoke test needs an existing allowance, independent of live LI.FI routing.
                preapprovedStringAmount: '10',
                status: body.trade?.approvalType === 'ZERO' ? 'APPROVAL_REQ' : 'CONFIRM',
                approvalType: body.trade?.approvalType,
                approvalStringAmount: '0',
                approvalGasEstimate: 65_000,
                dexTx: {
                    from: quoteRequest.fromAddress,
                    to: usdcContract,
                    value: '0x0',
                    data: revokeData,
                },
            };
            response.end(JSON.stringify(trade));
        } catch {
            response.writeHead(400);
            response.end(JSON.stringify({ error: 'Invalid fixture request' }));
        }
    }

    async stop(): Promise<void> {
        if (!this.server) return;

        const { server } = this;
        await new Promise<void>((resolve, reject) => {
            server.close(error => (error ? reject(error) : resolve()));
            server.closeAllConnections();
        });
        this.server = undefined;
    }
}
