import type { Page, Route } from '@playwright/test';

import { solanaUrlPattern } from './tradingMock';
import transactionResponse from '../../fixtures/staking/sol-stake-transactionResponse.json';
import { step } from '../common';

type JsonRequestBody = {
    id?: number | string;
    method?: string;
    params?: unknown[];
};

type SolanaRouteHandler = {
    enabled: boolean;
    predicate?: (params?: unknown[]) => boolean;
    respond: (route: Route, body: JsonRequestBody) => Promise<void>;
};

export type SolanaRouteHandlers = Record<SolanaRouteMethod, SolanaRouteHandler>;

export type SolanaRouteMethod =
    | 'getBalance'
    | 'sendTransaction'
    | 'simulateTransaction'
    | 'getSignatureStatuses'
    | 'getSignaturesForAddress'
    | 'getTransaction'
    | 'getProgramAccounts';

const fulfillWithResult = async (route: Route, body: JsonRequestBody, result: unknown) => {
    await route.fulfill({
        json: {
            jsonrpc: '2.0',
            id: body.id,
            result,
        },
    });
};

const createDefaultHandlers = (): SolanaRouteHandlers => ({
    // handler to mock initial SOL balance for staking
    getBalance: {
        enabled: true,
        predicate: params => params?.[0] === '8NapsSamBA2jd8VR8SZw4aXSvSAHiskUZXaiYW1HxTGe',
        respond: async (route, body) => {
            await fulfillWithResult(route, body, {
                context: { slot: 0 },
                value: 1_000_000_000_000,
            });
        },
    },
    //handlers for staking transaction flow
    sendTransaction: {
        enabled: true,
        respond: async (route, body) => {
            await fulfillWithResult(
                route,
                body,
                '41ZJr1SqnXVXym6EKrvfELQWh4pPdPeUSrj1GvcPNq9eL7Dh7QyCQXS65yahU6QtoBBNnfEJNGQ7poWRe4Gbk2Zd',
            );
        },
    },
    simulateTransaction: {
        enabled: true,
        respond: async (route, body) => {
            await fulfillWithResult(route, body, {
                value: {
                    err: null,
                    logs: [],
                    unitsConsumed: 0,
                },
            });
        },
    },
    getSignatureStatuses: {
        enabled: true,
        respond: async (route, body) => {
            await fulfillWithResult(route, body, {
                value: [
                    {
                        slot: 48,
                        confirmations: null,
                        err: null,
                        status: { Ok: null },
                        confirmationStatus: 'finalized',
                    },
                ],
            });
        },
    },
    //handlers for finalizing staking transaction flow
    getSignaturesForAddress: {
        enabled: false,
        predicate: params => params?.[0] === '8NapsSamBA2jd8VR8SZw4aXSvSAHiskUZXaiYW1HxTGe',
        respond: async (route, body) => {
            await fulfillWithResult(route, body, [
                {
                    blockTime: 1758796808,
                    confirmationStatus: 'finalized',
                    err: null,
                    memo: null,
                    signature:
                        '41ZJr1SqnXVXym6EKrvfELQWh4pPdPeUSrj1GvcPNq9eL7Dh7QyCQXS65yahU6QtoBBNnfEJNGQ7poWRe4Gbk2Zd',
                    slot: 369150991,
                },
            ]);
        },
    },
    getTransaction: {
        enabled: false,
        predicate: params =>
            params?.[0] ===
            '41ZJr1SqnXVXym6EKrvfELQWh4pPdPeUSrj1GvcPNq9eL7Dh7QyCQXS65yahU6QtoBBNnfEJNGQ7poWRe4Gbk2Zd',
        respond: async route => {
            await route.fulfill({ json: transactionResponse });
        },
    },
    //handler to mock stake account info after staking
    getProgramAccounts: {
        enabled: false,
        predicate: params => params?.[0] === 'Stake11111111111111111111111111111111111111',
        respond: async (route, body) => {
            await fulfillWithResult(route, body, [
                {
                    account: {
                        data: [
                            'AgAAAIDVIgAAAAAALLoqB9JwihwB0yi0PgwqY7NyafYZh7ClRRfrVgOgNbAsuioH0nCKHAHTKLQ+DCpjs3Jp9hmHsKVFF+tWA6A1sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHzgaQ+C+2FHX+u9FgXvIMNGqRZ3BtgpzkaZQ1xMJ4CuEYSdAAAAAABWAwAAAAAAAP//////////AAAAAAAA0D/KSY5NAAAAAAAAAAA=',
                            'base64',
                        ],
                        executable: false,
                        lamports: 12605841,
                        owner: 'Stake11111111111111111111111111111111111111',
                        rentEpoch: '18446744073709551615',
                        space: 200,
                    },
                    pubkey: '7XokGngi54KzoofSdrmk297pE43wtEqnsiSmDorU2ZBH',
                },
            ]);
        },
    },
});

const hasEnabledHandler = (
    handlers: SolanaRouteHandlers,
    method: string,
): method is keyof SolanaRouteHandlers =>
    Object.hasOwn(handlers, method) &&
    (handlers as Record<string, SolanaRouteHandler>)[method]?.enabled === true;

export class SolanaStakingMock {
    readonly handlers: SolanaRouteHandlers;

    constructor(
        private readonly page: Page,
        handlers: SolanaRouteHandlers = createDefaultHandlers(),
    ) {
        this.handlers = handlers;
    }

    async routeSolana(routeHandlers: SolanaRouteHandlers = this.handlers) {
        await this.page.route(solanaUrlPattern, route => this.handle(route, routeHandlers));
    }

    @step()
    enableRoutes(methods: SolanaRouteMethod[]) {
        methods.forEach(method => {
            this.getHandler(method).enabled = true;
        });
    }

    @step()
    disableRoutes(methods: SolanaRouteMethod[]) {
        methods.forEach(method => {
            this.getHandler(method).enabled = false;
        });
    }

    @step()
    replaceRoute(method: SolanaRouteMethod, overrides: Partial<SolanaRouteHandler>) {
        this.handlers[method] = {
            ...this.getHandler(method),
            ...overrides,
        };
    }

    private getHandler(method: SolanaRouteMethod): SolanaRouteHandler {
        if (!this.handlers[method]) {
            throw new Error(`Unknown Solana route method: ${method}`);
        }

        return this.handlers[method];
    }

    private async handle(route: Route, routeHandlers: SolanaRouteHandlers) {
        const body = route.request().postDataJSON() as JsonRequestBody;
        const { method } = body;
        // Continue if no handler is enabled for intercepted request's method
        if (!method || !hasEnabledHandler(routeHandlers, method)) {
            return route.continue();
        }

        const methodHandler = routeHandlers[method];
        // Continue if predicate does not match intercepted request's params
        if (methodHandler.predicate && !methodHandler.predicate(body.params)) {
            return route.continue();
        }

        await methodHandler.respond(route, body);
    }
}
