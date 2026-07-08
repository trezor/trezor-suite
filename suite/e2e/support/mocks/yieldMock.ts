import type { Page } from '@playwright/test';

import { step } from '../common';

export const YIELD_VAULTS = {
    usdcPrime: {
        id: 'steakusdc-prime-eth',
        name: 'Trezor Steakhouse USDC Prime',
        apy: '~4.26%',
        yearlyReward: '0 USDC',
        potentialReward: '42.6 USDC',
        apyBreakdown: {
            apyPercent: '4.26',
            symbols: ['USDC', 'MORPHO'],
            rates: ['+3.76% APY', '+0.5% APR'],
        },
    },
    usdtPrime: {
        id: 'steakusdt-prime-eth',
        name: 'Trezor Steakhouse USDT Prime',
        apy: '~6.4%',
        yearlyReward: '0 USDT',
        potentialReward: '64 USDT',
    },
} as const;

const YIELD_API_PATTERN = /\/yieldxyz\/v2\/yields/;
const YIELD_DETAIL_API_PATTERN = /\/yieldxyz\/v2\/yields\/(?<vaultId>[^/?]+)/;
const MERKL_API_PATTERN = /\/merkl\/v1\/users\/rewards/;
const BLOCKAID_API_PATTERN = /\/evm\/json-rpc\/scan/;

const USDC_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
// Trezor Steakhouse USDC Prime Vault
const YIELD_USDC_VAULT_ADDRESS = '0xde6c23E561F3e55846207EC45A91b777e0F7C889';
const USDC_VAULT = YIELD_USDC_VAULT_ADDRESS.toLowerCase();
const BLOCKAID_BENIGN_RESPONSE = {
    validation: {
        status: 'Success',
        result_type: 'Benign',
        classification: '',
        reason: '',
        description: '',
        features: [],
    },
    simulation: {
        status: 'Success',
        assets_diffs: {},
        exposures: {},
        total_usd_diff: {},
        address_details: {},

        account_summary: {
            assets_diffs: [
                {
                    asset_type: 'ERC20',
                    asset: {
                        type: 'ERC20',
                        address: USDC_CONTRACT,
                        decimals: 6,
                        name: 'USD Coin',
                        symbol: 'USDC',
                    },
                    in: [],
                    out: [
                        {
                            raw_value: '0x989680',
                            value: '10.0',
                            usd_price: '9.996549999999999159',
                            summary: 'Sending 10 USDC',
                        },
                    ],
                },
                {
                    asset_type: 'ERC20',
                    asset: {
                        type: 'ERC20',
                        address: USDC_VAULT,
                        decimals: 18,
                        name: YIELD_VAULTS.usdcPrime.name,
                        symbol: 'trSHUSDCp',
                    },
                    in: [
                        {
                            raw_value: '0x8a01083041395266',
                            value: '9.944238455556494216',
                            usd_price: '9.996535861217905605',
                            summary: 'Receiving 9.944 trSHUSDCp',
                        },
                    ],
                    out: [],
                },
            ],
            exposures: [],
            total_usd_diff: {
                in: '9.996535861217905605',
                out: '9.996549999999999159',
                total: '-0.000014138782093553',
            },
            total_usd_exposure: {},
            traces: [],
        },
        block: 'latest',
        addressbook_messages: [],
        error: null,
    },
};

const YIELD_VAULTS_RESPONSE = {
    items: [
        {
            id: YIELD_VAULTS.usdcPrime.id,
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
                symbol: 'trSHUSDCp',
                name: YIELD_VAULTS.usdcPrime.name,
                decimals: 18,
                network: 'ethereum',
                address: '0xde6c23e561f3e55846207ec45a91b777e0f7c889',
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
            // Share price so 10 USDC converts to ~9.944 trSHUSDCp shares (matches the deposit
            // simulation in yielddepositusdc.har): shares = amount / price.
            state: {
                pricePerShareState: {
                    price: '1.005606287729678',
                    shareToken: {
                        symbol: 'trSHUSDCp',
                        name: YIELD_VAULTS.usdcPrime.name,
                        decimals: 18,
                        network: 'ethereum',
                        address: '0xde6c23e561f3e55846207ec45a91b777e0f7c889',
                    },
                    quoteToken: {
                        symbol: 'USDC',
                        name: 'USD Coin',
                        decimals: 6,
                        network: 'ethereum',
                        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    },
                },
            },
            metadata: {
                name: YIELD_VAULTS.usdcPrime.name,
                description: 'Earn yield on USDC via Morpho.',
                underMaintenance: false,
                deprecated: false,
            },
        },
        {
            id: YIELD_VAULTS.usdtPrime.id,
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
                name: YIELD_VAULTS.usdtPrime.name,
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
                name: YIELD_VAULTS.usdtPrime.name,
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
        // Registered after the list route so it wins for `/yields/:vaultId` URLs, which the list
        // pattern would otherwise match too.
        await this.page.route(YIELD_DETAIL_API_PATTERN, route => {
            // match(YIELD_DETAIL_API_PATTERN)? is guaranteed to have match thanks to page.route and
            // the a capture group vaultId will have value. Either a string or empty string
            const vaultId = route.request().url().match(YIELD_DETAIL_API_PATTERN)?.groups?.vaultId;
            const vault = YIELD_VAULTS_RESPONSE.items.find(item => item.id === vaultId);

            return vault ? route.fulfill({ json: vault }) : route.continue();
        });
        await this.page.route(MERKL_API_PATTERN, route => route.fulfill({ json: [] }));
    }

    @step()
    async mockUsdcDeposit() {
        await this.page.route(BLOCKAID_API_PATTERN, route =>
            route.fulfill({ json: BLOCKAID_BENIGN_RESPONSE }),
        );
    }

    @step()
    async stop() {
        await this.page.unroute(BLOCKAID_API_PATTERN);
        await this.page.unroute(MERKL_API_PATTERN);
        await this.page.unroute(YIELD_DETAIL_API_PATTERN);
        await this.page.unroute(YIELD_API_PATTERN);
    }
}
