import type { Page } from '@playwright/test';

import { step } from '../common';

export const YIELD_VAULT_NAMES = {
    usdcPrime: 'Trezor Steakhouse USDC Prime',
    usdtPrime: 'Trezor Steakhouse USDT Prime',
} as const;

export const YIELD_VAULT_APYS = {
    usdcPrime: '~4.26%',
    usdtPrime: '~6.4%',
} as const;

export const YIELD_VAULT_REWARDS = {
    usdcPrime: { yearly: '0 USDC', potential: '42.6 USDC' },
    usdtPrime: { yearly: '0 USDT', potential: '64 USDT' },
} as const;

export const YIELD_VAULT_APY_BREAKDOWN = {
    usdcPrime: {
        apyPercent: '4.26',
        symbols: ['USDC', 'MORPHO'],
        rates: ['+3.76%', '+0.5%'],
    },
} as const;

const YIELD_API_PATTERN = /\/yieldxyz\/v1\/yields/;
const MERKL_API_PATTERN = /\/merkl\/v1\/users\/rewards/;

const YIELD_VAULTS_RESPONSE = {
    items: [
        {
            id: 'steakusdc-prime-eth',
            providerId: 'morpho',
            network: 'ethereum',
            chainId: 1,
            token: {
                symbol: 'USDC',
                name: 'USD Coin',
                decimals: 6,
                network: 'ethereum',
                address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            },
            outputToken: {
                symbol: 'steakUSDC',
                name: YIELD_VAULT_NAMES.usdcPrime,
                decimals: 6,
                network: 'ethereum',
                address: '0x624087dd1904ab122a32878ce9e933c7071f53b9',
            },
            inputTokens: [
                {
                    symbol: 'USDC',
                    name: 'USD Coin',
                    decimals: 6,
                    network: 'ethereum',
                    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                },
            ],
            rewardRate: {
                total: 0.0426,
                rateType: 'APY',
                components: [
                    {
                        rate: 0.0376,
                        rateType: 'APY',
                        yieldSource: 'lending',
                        token: {
                            symbol: 'USDC',
                            name: 'USD Coin',
                            decimals: 6,
                            network: 'ethereum',
                            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        },
                    },
                    {
                        rate: 0.005,
                        rateType: 'APY',
                        yieldSource: 'protocol_incentive',
                        token: {
                            symbol: 'MORPHO',
                            name: 'Morpho Token',
                            decimals: 18,
                            network: 'ethereum',
                            address: '0x9994e35db50125e0df82e4c2dde62496ce330999',
                        },
                    },
                ],
            },
            status: {
                enter: true,
                exit: true,
            },
            metadata: {
                name: YIELD_VAULT_NAMES.usdcPrime,
                description: 'Earn yield on USDC via Morpho.',
                underMaintenance: false,
                deprecated: false,
            },
        },
        {
            id: 'steakusdt-prime-eth',
            providerId: 'morpho',
            network: 'ethereum',
            chainId: 1,
            token: {
                symbol: 'USDT',
                name: 'Tether USD',
                decimals: 6,
                network: 'ethereum',
                address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            },
            outputToken: {
                symbol: 'steakUSDT',
                name: YIELD_VAULT_NAMES.usdtPrime,
                decimals: 6,
                network: 'ethereum',
                address: '0xbeed7a9ef40bb1f4928b8b5a1b8ae35db4bc0c5a',
            },
            inputTokens: [
                {
                    symbol: 'USDT',
                    name: 'Tether USD',
                    decimals: 6,
                    network: 'ethereum',
                    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
                },
            ],
            rewardRate: {
                total: 0.064,
                rateType: 'APY',
                components: [],
            },
            status: {
                enter: true,
                exit: true,
            },
            metadata: {
                name: YIELD_VAULT_NAMES.usdtPrime,
                description: 'Earn yield on USDT via Morpho.',
                underMaintenance: false,
                deprecated: false,
            },
        },
    ],
    total: 2,
    offset: 0,
    limit: 100,
};

export class YieldMock {
    constructor(private readonly page: Page) {}

    @step()
    async start() {
        await this.page.route(YIELD_API_PATTERN, route =>
            route.fulfill({ json: YIELD_VAULTS_RESPONSE }),
        );
        await this.page.route(MERKL_API_PATTERN, route => route.fulfill({ json: [] }));
    }
}
