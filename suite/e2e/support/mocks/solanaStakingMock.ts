import type { Page, Route } from '@playwright/test';

import { solanaUrlPattern } from './tradingMock';
import transactionResponse from '../../fixtures/staking/sol-stake-transactionResponse.json';
import {
    SolanaStakingAccount,
    solStakingAccountDeactivating,
    solStakingAccountFirst,
} from '../../fixtures/staking/sol-staking-accounts';
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
    | 'getEpochInfo'
    | 'getBalance'
    | 'sendTransaction'
    | 'simulateTransaction'
    | 'getSignatureStatuses'
    | 'getSignaturesForAddress'
    | 'getTransaction'
    | 'getProgramAccounts';

const BASE_EPOCH = 864; // chosen based of our mocked program accounts activation/deactivation epochs

export const fulfillWithResult = async (route: Route, body: JsonRequestBody, result: unknown) => {
    await route.fulfill({
        json: {
            jsonrpc: '2.0',
            id: body.id,
            result,
        },
    });
};

const createDefaultHandlers = (): SolanaRouteHandlers => ({
    // handler to freeze epoch info so stake warmup/withdraw/claim amount dont change over time
    // their state is defined by relation between activationEpoch, deactivationEpoch and current epoch
    getEpochInfo: {
        enabled: true,
        respond: async (route, body) => {
            const slotIndex = 376284;
            const slotsInEpoch = 432000;
            await fulfillWithResult(route, body, {
                absoluteSlot: BASE_EPOCH * slotsInEpoch + slotIndex,
                blockHeight: 359120112,
                epoch: BASE_EPOCH,
                slotIndex,
                slotsInEpoch,
                transactionCount: 464794163561,
            });
        },
    },
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
    //handler to mock stake account info, starts empty
    getProgramAccounts: {
        enabled: true,
        predicate: params => params?.[0] === 'Stake11111111111111111111111111111111111111',
        respond: async (route, body) => {
            await fulfillWithResult(route, body, []);
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
    protected currentEpoch: number = BASE_EPOCH;
    readonly fee: number = 0.00228788;
    readonly feeFormatted: string = '0.00228788 SOL';
    readonly rentFee: number = 0.000005;

    constructor(
        private readonly page: Page,
        handlers: SolanaRouteHandlers = createDefaultHandlers(),
    ) {
        this.handlers = handlers;
    }

    async routeSolana(routeHandlers: SolanaRouteHandlers = this.handlers) {
        await this.page.route(solanaUrlPattern, route => this.handle(route, routeHandlers));
    }

    addFeeTo(amountInSol: string): string {
        const total = Number(amountInSol) + this.fee - this.rentFee;

        return `${total.toFixed(9)} SOL`;
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
    enableRoutesForTransactions() {
        // necessary routes for sending and finalizing transactions
        // cannot be enabled during discovery as they would interfere with it
        this.enableRoutes(['getTransaction', 'getSignaturesForAddress']);
    }

    @step()
    async replaceRoute(method: SolanaRouteMethod, overrides: Partial<SolanaRouteHandler>) {
        this.handlers[method] = {
            ...this.getHandler(method),
            ...overrides,
        };
        await this.routeSolana();
    }

    @step()
    async setProgramAccounts(accounts: SolanaStakingAccount[]) {
        await this.replaceRoute('getProgramAccounts', {
            respond: async (route, body) => {
                await fulfillWithResult(route, body, accounts);
            },
        });
    }

    @step()
    async setEpoch(epoch: number) {
        const slotIndex = 376284;
        const slotsInEpoch = 432000;
        await this.replaceRoute('getEpochInfo', {
            respond: async (route, body) => {
                await fulfillWithResult(route, body, {
                    absoluteSlot: epoch * slotsInEpoch + slotIndex,
                    blockHeight: 359120112,
                    epoch,
                    slotIndex,
                    slotsInEpoch,
                    transactionCount: 464794163561,
                });
            },
        });
        this.currentEpoch = epoch;
    }

    @step()
    async advanceEpoch() {
        await this.setEpoch(this.currentEpoch + 1);
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

    @step()
    async setupStakedAccount() {
        await this.setProgramAccounts([solStakingAccountFirst.payload]);
        const epochAfterActivation = solStakingAccountFirst.activationEpoch + 1;
        await this.setEpoch(epochAfterActivation);
    }

    @step()
    async setupUnstakingAccount() {
        await this.setProgramAccounts([solStakingAccountDeactivating.payload]);
        const { deactivationEpoch } = solStakingAccountDeactivating;
        await this.setEpoch(deactivationEpoch);
    }
}
