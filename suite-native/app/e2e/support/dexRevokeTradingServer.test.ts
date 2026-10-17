/** @jest-environment node */
import fetch from 'cross-fetch';
import type { ExchangeListResponse, ExchangeTrade, ExchangeTradeQuoteResponse } from 'invity-api';

import { DexRevokeTradingServer } from './dexRevokeTradingServer';

const usdc = 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const usdt = 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7';
const fromAddress = '0x1111111111111111111111111111111111111111';

describe('DEX revoke trading API fixture', () => {
    const server = new DexRevokeTradingServer();

    beforeAll(async () => {
        await server.start();
    });

    afterAll(async () => {
        await server.stop();
    });

    it('provides a revocable USDC quote and composes a zero allowance transaction', async () => {
        const providersResponse = await fetch(`${server.url}/api/v3/exchange/list`);
        expect(providersResponse.status).toBe(200);
        const providers: ExchangeListResponse = await providersResponse.json();
        expect(providers).toEqual([expect.objectContaining({ name: 'lifi', isDex: true })]);

        const quotesResponse = await fetch(`${server.url}/api/v3/exchange/quotes`, {
            method: 'POST',
            body: JSON.stringify({ send: usdc, receive: usdt, sendStringAmount: '6', fromAddress }),
        });
        expect(quotesResponse.status).toBe(200);
        const quotes: ExchangeTradeQuoteResponse = await quotesResponse.json();
        expect(quotes).toHaveLength(1);

        const prefetchedResponse = await fetch(`${server.url}/api/v3/exchange/trade`, {
            method: 'POST',
            body: JSON.stringify({
                trade: quotes[0],
                receiveAddress: fromAddress,
                refundAddress: fromAddress,
                approvalFlow: true,
            }),
        });
        expect(prefetchedResponse.status).toBe(200);
        const prefetched: ExchangeTrade = await prefetchedResponse.json();
        expect(prefetched.preapprovedStringAmount).toBe('10');
        expect(prefetched.status).toBe('CONFIRM');

        const revokeResponse = await fetch(`${server.url}/api/v3/exchange/trade`, {
            method: 'POST',
            body: JSON.stringify({
                trade: { ...prefetched, approvalType: 'ZERO' },
                receiveAddress: fromAddress,
                refundAddress: fromAddress,
            }),
        });
        expect(revokeResponse.status).toBe(200);
        const revoke: ExchangeTrade = await revokeResponse.json();
        expect(revoke.status).toBe('APPROVAL_REQ');
        expect(revoke.approvalType).toBe('ZERO');
        expect(revoke.dexTx).toEqual({
            from: fromAddress,
            to: usdc.split('--')[1],
            value: '0x0',
            data: expect.stringMatching(/^0x095ea7b3[0-9a-f]{64}0{64}$/),
        });
    });

    it('rejects unsupported endpoints instead of forwarding requests', async () => {
        const response = await fetch(`${server.url}/api/sign-trade`, {
            method: 'POST',
            body: '{}',
        });
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: 'Unsupported fixture endpoint' });
    });

    it('rejects malformed requests and unsupported token pairs', async () => {
        const malformed = await fetch(`${server.url}/api/v3/exchange/trade`, {
            method: 'POST',
            body: 'not JSON',
        });
        expect(malformed.status).toBe(400);
        expect(await malformed.json()).toEqual({ error: 'Invalid fixture request' });

        const unsupported = await fetch(`${server.url}/api/v3/exchange/quotes`, {
            method: 'POST',
            body: JSON.stringify({ send: usdt, receive: usdc, sendStringAmount: '6', fromAddress }),
        });
        expect(unsupported.status).toBe(400);
        expect(await unsupported.json()).toEqual({ error: 'Unsupported fixture quote' });
    });
});
