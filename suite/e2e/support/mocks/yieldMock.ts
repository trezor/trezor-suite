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
    wethPrime: {
        id: 'steakweth-prime-eth',
        name: 'Trezor Steakhouse ETH Prime',
        apy: '~3.1%',
        apyBreakdown: {
            apyPercent: '3.1',
            symbols: ['WETH', 'MORPHO'],
            rates: ['+2.6% APY', '+0.5% APR'],
        },
    },
} as const;

const YIELD_API_PATTERN = /\/yieldxyz\/v2\/yields/;
const YIELD_DETAIL_API_PATTERN = /\/yieldxyz\/v2\/yields\/(?<vaultId>[^/?]+)/;
const VAULT_ADDRESS_API_PATTERN = /\/vaults\/v1\//;
const MERKL_API_PATTERN = /\/merkl\/v1\/users\/rewards/;
const BLOCKAID_API_PATTERN = /\/evm\/json-rpc\/scan/;

const USDC_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
// Trezor Steakhouse USDC Prime Vault
const YIELD_USDC_VAULT_ADDRESS = '0xde6c23E561F3e55846207EC45A91b777e0F7C889';
const USDC_VAULT = YIELD_USDC_VAULT_ADDRESS.toLowerCase();

// Canonical WETH — must match WRAPPED_NATIVE in @trezor/network-ethereum so the vault is
// recognized as wrapped-native and the deposit flow offers the ETH → WETH wrap step.
const WETH_CONTRACT = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
// Real Trezor Steakhouse ETH vault — firmware embeds its definition, so the device shows the
// vault name and WETH amounts during signing instead of a raw address and "Wei UNKN".
const YIELD_WETH_VAULT_ADDRESS = '0x704cFb08969048a8DFf298B214F959791d8Da509';
const WETH_VAULT = YIELD_WETH_VAULT_ADDRESS.toLowerCase();

export const YIELD_WETH_VAULT_SHARE_TOKEN = {
    type: 'ERC20',
    standard: 'ERC20',
    name: YIELD_VAULTS.wethPrime.name,
    contract: WETH_VAULT,
    symbol: 'trSHWETHp',
    decimals: 18,
    // 10 WETH deposited at pricePerShare 1.25 mints exactly 8 shares.
    balance: '8000000000000000000',
    transfers: 1,
} as const;

export const YIELD_WETH_TOKEN = {
    type: 'ERC20',
    standard: 'ERC20',
    name: 'Wrapped Ether',
    contract: WETH_CONTRACT,
    symbol: 'WETH',
    decimals: 18,
    balance: '10000000000000000000',
    transfers: 1,
} as const;

export const YIELD_USDC_VAULT_SHARE_TOKEN = {
    type: 'ERC20',
    standard: 'ERC20',
    name: YIELD_VAULTS.usdcPrime.name,
    contract: USDC_VAULT,
    symbol: 'trSHUSDCp',
    decimals: 18,
    balance: '9944238455556494216',
    transfers: 1,
} as const;

export const YIELD_NEW_BLOCK = {
    height: 22881954,
    hash: '0xa07d0d92b6bb9a5f388d47a10b824b4b09e0b3aeb08d0f61c0e30a25f6c8455f',
} as const;

// Share token balance converted by pricePerShareState.price (1.005607422297114), as displayed
export const YIELD_USDC_DEPOSITED_AMOUNT = '10';

// Merkl protocol-incentive reward (MORPHO) claimable by the mocked account.
const MORPHO_CONTRACT = '0x58D97B57BB95320F9a05dC918Aef65434969c2B2';
export const YIELD_MERKL_CLAIM_REWARD = {
    token: {
        address: MORPHO_CONTRACT,
        chainId: 1,
        symbol: 'MORPHO',
        decimals: 18,
    },
    // claimed and pending are 0, so the on-chain cumulative amount equals the claimable amount.
    amount: '2500000000000000000',
    claimable: '2500000000000000000',
    claimableUnits: '2.5',
} as const;

// MORPHO token entry for the blockbook account state after the claim is confirmed.
export const YIELD_CLAIMED_MORPHO_TOKEN = {
    type: 'ERC20',
    standard: 'ERC20',
    name: 'Morpho Token',
    contract: MORPHO_CONTRACT.toLowerCase(),
    symbol: 'MORPHO',
    decimals: 18,
    balance: YIELD_MERKL_CLAIM_REWARD.claimable,
    transfers: 1,
} as const;
const USDC_ASSET = {
    type: 'ERC20',
    address: USDC_CONTRACT,
    decimals: 6,
    name: 'USD Coin',
    symbol: 'USDC',
};

const USDC_VAULT_SHARE_ASSET = {
    type: 'ERC20',
    address: USDC_VAULT,
    decimals: 18,
    name: YIELD_VAULTS.usdcPrime.name,
    symbol: 'trSHUSDCp',
};

const MORPHO_ASSET = {
    type: 'ERC20',
    address: MORPHO_CONTRACT,
    decimals: 18,
    name: 'Morpho Token',
    symbol: 'MORPHO',
};

const ETH_NATIVE_ASSET = {
    type: 'NATIVE',
    chain_family: 'ethereum',
    chain_id: 1,
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
};

const WETH_ASSET = {
    type: 'ERC20',
    address: WETH_CONTRACT,
    decimals: 18,
    name: 'Wrapped Ether',
    symbol: 'WETH',
};

const WETH_VAULT_SHARE_ASSET = {
    type: 'ERC20',
    address: WETH_VAULT,
    decimals: 18,
    name: YIELD_VAULTS.wethPrime.name,
    symbol: 'trSHWETHp',
};

type BlockaidAsset = {
    type: string;
    decimals: number;
    name: string;
    symbol: string;
    address?: string;
    chain_family?: string;
    chain_id?: number;
};

type BlockaidTransfer = {
    asset: BlockaidAsset;
    rawValue: string;
    value: string;
    usdPrice: string;
    summary: string;
};

const createBlockaidBenignResponse = ({
    sent,
    received,
}: {
    sent?: BlockaidTransfer;
    received: BlockaidTransfer;
}) => ({
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
                ...(sent
                    ? [
                          {
                              asset_type: sent.asset.type,
                              asset: sent.asset,
                              in: [],
                              out: [
                                  {
                                      raw_value: sent.rawValue,
                                      value: sent.value,
                                      usd_price: sent.usdPrice,
                                      summary: sent.summary,
                                  },
                              ],
                          },
                      ]
                    : []),
                {
                    asset_type: received.asset.type,
                    asset: received.asset,
                    in: [
                        {
                            raw_value: received.rawValue,
                            value: received.value,
                            usd_price: received.usdPrice,
                            summary: received.summary,
                        },
                    ],
                    out: [],
                },
            ],
            exposures: [],
            total_usd_diff: {
                in: received.usdPrice,
                out: sent?.usdPrice ?? '0',
                total: (Number(received.usdPrice) - Number(sent?.usdPrice ?? '0')).toString(),
            },
            total_usd_exposure: {},
            traces: [],
        },
        block: 'latest',
        addressbook_messages: [],
        error: null,
    },
});

const BLOCKAID_DEPOSIT_RESPONSE = createBlockaidBenignResponse({
    sent: {
        asset: USDC_ASSET,
        rawValue: '0x989680',
        value: '10.0',
        usdPrice: '9.996549999999999159',
        summary: 'Sending 10 USDC',
    },
    received: {
        asset: USDC_VAULT_SHARE_ASSET,
        rawValue: '0x8a01083041395266',
        value: '9.944238455556494216',
        usdPrice: '9.996535861217905605',
        summary: 'Receiving 9.944 trSHUSDCp',
    },
});

const BLOCKAID_WITHDRAW_RESPONSE = createBlockaidBenignResponse({
    sent: {
        asset: USDC_VAULT_SHARE_ASSET,
        rawValue: '0x45008418209ca967',
        value: '4.972119227778247015',
        usdPrice: '4.998272935608987',
        summary: 'Sending 4.972 trSHUSDCp',
    },
    received: {
        asset: USDC_ASSET,
        rawValue: '0x4c4b40',
        value: '5.0',
        usdPrice: '4.998274999999999579',
        summary: 'Receiving 5 USDC',
    },
});

// Redemption of 3 trSHUSDCp shares pays out 3 × pricePerShare = 3.016822 USDC.
const BLOCKAID_REDEEM_RESPONSE = createBlockaidBenignResponse({
    sent: {
        asset: USDC_VAULT_SHARE_ASSET,
        rawValue: '0x29a2241af62c0000',
        value: '3.0',
        usdPrice: '3.015781224726041',
        summary: 'Sending 3 trSHUSDCp',
    },
    received: {
        asset: USDC_ASSET,
        rawValue: '0x2e0876',
        value: '3.016822',
        usdPrice: '3.015781224726041',
        summary: 'Receiving 3.016822 USDC',
    },
});

// Wrapping calls WETH deposit() with the amount as native value: 10 ETH out, 10 WETH in.
const BLOCKAID_WRAP_RESPONSE = createBlockaidBenignResponse({
    sent: {
        asset: ETH_NATIVE_ASSET,
        rawValue: '0x8ac7230489e80000',
        value: '10.0',
        usdPrice: '25000',
        summary: 'Sending 10 ETH',
    },
    received: {
        asset: WETH_ASSET,
        rawValue: '0x8ac7230489e80000',
        value: '10.0',
        usdPrice: '25000',
        summary: 'Receiving 10 WETH',
    },
});

// Depositing 10 WETH at pricePerShare 1.25 mints exactly 8 vault shares.
const BLOCKAID_WETH_DEPOSIT_RESPONSE = createBlockaidBenignResponse({
    sent: {
        asset: WETH_ASSET,
        rawValue: '0x8ac7230489e80000',
        value: '10.0',
        usdPrice: '25000',
        summary: 'Sending 10 WETH',
    },
    received: {
        asset: WETH_VAULT_SHARE_ASSET,
        rawValue: '0x6f05b59d3b200000',
        value: '8.0',
        usdPrice: '25000',
        summary: 'Receiving 8 trSHWETHp',
    },
});

// Claiming Merkl rewards only receives tokens; there is no outgoing transfer.
const BLOCKAID_CLAIM_RESPONSE = createBlockaidBenignResponse({
    received: {
        asset: MORPHO_ASSET,
        rawValue: '0x22b1c8c1227a0000',
        value: '2.5',
        usdPrice: '2.5',
        summary: 'Receiving 2.5 MORPHO',
    },
});

const createMerklRewardsResponse = (entries: { chainId: number; address: string }[]) =>
    entries.map(({ chainId, address }) => ({
        chainId,
        address,
        rewards: [
            {
                root: '0xdd919087d979f8b985e53c9c360709d2a751f8c5dabe3834a4552a49e3b836cd',
                amount: YIELD_MERKL_CLAIM_REWARD.amount,
                claimed: '0',
                pending: '0',
                token: YIELD_MERKL_CLAIM_REWARD.token,
                proofs: [
                    '0x8e18f5e7ec457f26c11ed8659eda26b740a0dbe125e1276c675f89b9916cee5a',
                    '0x6da49a874e58d9268789b2c5d7fda203407321b8f2b985cc31cc83d07e683591',
                ],
                claimable: YIELD_MERKL_CLAIM_REWARD.claimable,
            },
        ],
        totalClaimable: YIELD_MERKL_CLAIM_REWARD.claimable,
    }));

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

            state: {
                pricePerShareState: {
                    price: '1.005607422297114',
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
        {
            id: YIELD_VAULTS.wethPrime.id,
            providerId: 'morpho',
            network: 'ethereum',
            chainId: 1,
            token: {
                symbol: 'WETH',
                name: 'Wrapped Ether',
                decimals: 18,
                network: 'ethereum',
                address: WETH_CONTRACT,
            },
            outputToken: {
                symbol: 'trSHWETHp',
                name: YIELD_VAULTS.wethPrime.name,
                decimals: 18,
                network: 'ethereum',
                address: WETH_VAULT,
            },
            inputTokens: [
                {
                    symbol: 'WETH',
                    name: 'Wrapped Ether',
                    decimals: 18,
                    network: 'ethereum',
                    address: WETH_CONTRACT,
                },
            ],
            rewardRate: {
                total: 0.031,
                rateType: 'APY',
                components: [
                    {
                        rate: 0.026,
                        rateType: 'APY',
                        yieldSource: 'lending',
                        token: {
                            symbol: 'WETH',
                            name: 'Wrapped Ether',
                            decimals: 18,
                            network: 'ethereum',
                            address: WETH_CONTRACT,
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
            state: {
                pricePerShareState: {
                    price: '1.25',
                    shareToken: {
                        symbol: 'trSHWETHp',
                        name: YIELD_VAULTS.wethPrime.name,
                        decimals: 18,
                        network: 'ethereum',
                        address: WETH_VAULT,
                    },
                    quoteToken: {
                        symbol: 'WETH',
                        name: 'Wrapped Ether',
                        decimals: 18,
                        network: 'ethereum',
                        address: WETH_CONTRACT,
                    },
                },
            },
            metadata: {
                name: YIELD_VAULTS.wethPrime.name,
                description: 'Earn yield on WETH via Morpho.',
                underMaintenance: false,
                deprecated: false,
            },
        },
    ],
    total: 3,
    offset: 0,
    limit: 100,
};

export class YieldMock {
    constructor(private readonly page: Page) {}

    @step()
    async start() {
        // The vault detail pages look a vault up via `getYields` with an `outputTokens` query
        // filter and take the first item, so the filter must be honored — always answering with
        // the full list would resolve every vault to the first one (USDC).
        await this.page.route(YIELD_API_PATTERN, route => {
            const url = route.request().url().toLowerCase();
            const filteredItems = YIELD_VAULTS_RESPONSE.items.filter(item =>
                url.includes(item.outputToken.address.toLowerCase()),
            );
            const items = filteredItems.length > 0 ? filteredItems : YIELD_VAULTS_RESPONSE.items;

            return route.fulfill({
                json: { ...YIELD_VAULTS_RESPONSE, items, total: items.length },
            });
        });
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
        // Vault address lookup (getYieldVault, `/vaults/v1/:networkSymbol/:vaultId`) used when
        // composing transactions targeting the vault contract.
        await this.page.route(VAULT_ADDRESS_API_PATTERN, route => {
            const isWethVault = route.request().url().includes(YIELD_VAULTS.wethPrime.id);

            return route.fulfill({
                json: {
                    address: isWethVault ? YIELD_WETH_VAULT_ADDRESS : YIELD_USDC_VAULT_ADDRESS,
                },
            });
        });
    }

    @step()
    async mockUsdcDeposit() {
        await this.page.route(BLOCKAID_API_PATTERN, route =>
            route.fulfill({ json: BLOCKAID_DEPOSIT_RESPONSE }),
        );
    }

    @step()
    async mockEthWrap() {
        await this.page.route(BLOCKAID_API_PATTERN, route =>
            route.fulfill({ json: BLOCKAID_WRAP_RESPONSE }),
        );
    }

    @step()
    async mockWethDeposit() {
        await this.page.route(BLOCKAID_API_PATTERN, route =>
            route.fulfill({ json: BLOCKAID_WETH_DEPOSIT_RESPONSE }),
        );
    }

    @step()
    async mockUsdcWithdraw() {
        await this.page.route(BLOCKAID_API_PATTERN, route =>
            route.fulfill({ json: BLOCKAID_WITHDRAW_RESPONSE }),
        );
    }

    @step()
    async mockUsdcRedeem() {
        await this.page.route(BLOCKAID_API_PATTERN, route =>
            route.fulfill({ json: BLOCKAID_REDEEM_RESPONSE }),
        );
    }

    // Serves claimable Merkl rewards for every queried account. Once Suite polls with
    // `reloadChainId` after the claim tx is confirmed (waitForMerklToResolveClaim), the mock
    // switches to empty rewards for good — the same way real Merkl reports a settled claim.
    @step()
    async mockMerklRewards() {
        let isClaimSettled = false;

        await this.page.route(MERKL_API_PATTERN, route => {
            const entries: { chainId: number; address: string; reloadChainId?: number }[] = route
                .request()
                .postDataJSON();

            if (entries.some(entry => entry.reloadChainId !== undefined)) {
                isClaimSettled = true;
            }

            return route.fulfill({
                json: isClaimSettled ? [] : createMerklRewardsResponse(entries),
            });
        });
    }

    @step()
    async mockMorphoClaim() {
        await this.page.route(BLOCKAID_API_PATTERN, route =>
            route.fulfill({ json: BLOCKAID_CLAIM_RESPONSE }),
        );
    }
}
