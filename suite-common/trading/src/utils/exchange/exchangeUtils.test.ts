import { type CryptoId } from 'invity-api';

import { type Network } from '@suite-common/wallet-config';
import { type Account, type PrecomposedLevels } from '@suite-common/wallet-types';
import { buildApprovalTransactionData } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

import {
    deriveBitcoinSwapFromAddresses,
    getApprovalStatus,
    getDexEstimationData,
    getDisplayComposedLevels,
    getDisplayNetworkFee,
    hasEip712SignDataType,
    requiresErc20Approval,
    requiresTokenApproval,
    tokenSupportsIncreasingAllowance,
} from './exchangeUtils';

jest.mock('@trezor/connect', () => ({
    composeTransaction: jest.fn(),
}));

const USDT_CRYPTO_ID = 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId;
const DAI_CRYPTO_ID = 'ethereum--0x6b175474e89094c44da98b954eedeac495271d0f' as CryptoId;
const USDT_SOLANA_CRYPTO_ID = 'solana--Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' as CryptoId;
const USDC_BASE_CRYPTO_ID = 'base--0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as CryptoId;

describe('requiresErc20Approval', () => {
    it('should return false when no crypto id is provided', () => {
        expect(requiresErc20Approval(undefined)).toBe(false);
    });

    it('should return true for an ERC-20 token', () => {
        expect(requiresErc20Approval(USDT_CRYPTO_ID)).toBe(true);
    });

    it('should return true for a token on another EVM network', () => {
        expect(requiresErc20Approval(USDC_BASE_CRYPTO_ID)).toBe(true);
    });

    it('should return false for a native EVM coin', () => {
        expect(requiresErc20Approval('ethereum' as CryptoId)).toBe(false);
    });

    it('should return false for a native EVM coin addressed by the zero contract', () => {
        expect(
            requiresErc20Approval('base--0x0000000000000000000000000000000000000000' as CryptoId),
        ).toBe(false);
    });

    it('should return false for a non-EVM network, both native and token', () => {
        expect(requiresErc20Approval('solana' as CryptoId)).toBe(false);
        expect(requiresErc20Approval(USDT_SOLANA_CRYPTO_ID)).toBe(false);
    });
});

describe('requiresTokenApproval', () => {
    it('should return false when no quote is provided', () => {
        const result = requiresTokenApproval(undefined);
        expect(result).toBe(false);
    });

    it('should return false for CEX quotes', () => {
        const quote = {
            orderId: 'test-order',
            isDex: false,
            send: 'ethereum' as CryptoId,
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(false);
    });

    it('should return false when sending native EVM token (ETH)', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: 'ethereum' as CryptoId,
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(false);
    });

    it('should return false when send is not specified', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(false);
    });

    it('should return false when sending native SOL', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: 'solana' as CryptoId,
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(false);
    });

    it('should return false when sending an SPL token', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: USDT_SOLANA_CRYPTO_ID,
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(false);
    });

    it('should return true for DEX quotes with ERC-20 tokens', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: USDT_CRYPTO_ID,
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(true);
    });

    it('should return true for DEX quotes with ERC-20 tokens when EIP-712 sign data is missing', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: USDT_CRYPTO_ID,
            status: 'SIGN_DATA' as const,
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(true);
    });

    it('should return true for DEX quotes with ERC-20 tokens when sign data is not EIP-712', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: USDT_CRYPTO_ID,
            status: 'SIGN_DATA' as const,
            signData: {
                type: 'slip24',
                data: {},
            } as any,
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(true);
    });

    it('should return false for DEX quotes with ERC-20 tokens when status is SIGN_DATA with EIP-712 data', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: USDT_CRYPTO_ID,
            status: 'SIGN_DATA' as const,
            signData: {
                type: 'eip712-typed-data' as const,
                data: {},
            },
        };
        const result = requiresTokenApproval(quote);
        expect(result).toBe(false);
    });
});

describe('getApprovalStatus', () => {
    it('should return null when no quote is provided', () => {
        const result = getApprovalStatus(undefined);
        expect(result).toBe(null);
    });

    it('should return "approved" when quote has preapprovedStringAmount and is not APPROVAL_REQ', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: '0.001',
            isDex: true,
            send: DAI_CRYPTO_ID,
            status: 'CONFIRM' as const,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('approved');
    });

    it('should return "approved" when quote has preapprovedStringAmount !== "0" without status', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: '0.001',
            isDex: true,
            send: DAI_CRYPTO_ID,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('approved');
    });

    it('should return "needs_increase" when quote has preapprovedStringAmount !== "0" and status is APPROVAL_REQ', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: '0.001',
            isDex: true,
            send: DAI_CRYPTO_ID,
            status: 'APPROVAL_REQ' as const,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('needs_increase');
    });

    it('should return "needs_revoke" when quote has preapprovedStringAmount !== "0" and status is APPROVAL_REQ and tokenSupportsIncreasingAllowance is false', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: '0.001',
            isDex: true,
            send: USDT_CRYPTO_ID,
            status: 'APPROVAL_REQ' as const,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('needs_revoke');
    });

    it('should return "needs_approval" when preapprovedStringAmount is "0" and isDex is true', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: '0',
            isDex: true,
            send: DAI_CRYPTO_ID,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('needs_approval');
    });

    it('should return "needs_approval" when quote is DEX', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: undefined,
            isDex: true,
            send: DAI_CRYPTO_ID,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('needs_approval');
    });

    it('should return "not_needed" for regular quote', () => {
        const quote = {
            orderId: 'test-order',
            preapprovedStringAmount: undefined,
            isDex: false,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('not_needed');
    });

    it('should return "not_needed" for quote with SIGN_DATA status and EIP-712 data', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: DAI_CRYPTO_ID,
            status: 'SIGN_DATA' as const,
            signData: {
                type: 'eip712-typed-data' as const,
                data: {},
            },
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('not_needed');
    });

    it('should return "needs_approval" for quote with SIGN_DATA status and non-EIP-712 data', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: DAI_CRYPTO_ID,
            status: 'SIGN_DATA' as const,
            signData: {
                type: 'slip24',
                data: {},
            } as any,
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('needs_approval');
    });

    it('should return "needs_approval" for quote with EIP-712 data without SIGN_DATA status', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: DAI_CRYPTO_ID,
            signData: {
                type: 'eip712-typed-data' as const,
                data: {},
            },
        };
        const result = getApprovalStatus(quote);
        expect(result).toBe('needs_approval');
    });
});

describe('tokenSupportsIncreasingAllowance', () => {
    it('should return false for Ethereum USDT contract address (uppercase)', () => {
        const result = tokenSupportsIncreasingAllowance(
            '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        );
        expect(result).toBe(false);
    });

    it('should return false for Ethereum USDT contract address (lowercase)', () => {
        const result = tokenSupportsIncreasingAllowance(
            '0xdac17f958d2ee523a2206206994597c13d831ec7',
        );
        expect(result).toBe(false);
    });

    it('should return true for other contract addresses', () => {
        const result = tokenSupportsIncreasingAllowance(
            '0x1234567890123456789012345678901234567890',
        );
        expect(result).toBe(true);
    });

    it('should return false for undefined contract address', () => {
        const result = tokenSupportsIncreasingAllowance(undefined);
        expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
        const result = tokenSupportsIncreasingAllowance('');
        expect(result).toBe(false);
    });
});

describe('getDexEstimationData', () => {
    const spender = '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae';
    const approveData = buildApprovalTransactionData({ spender, amount: '9475047' });

    const buildDexTx = (data: string) => ({
        from: '0x9cd02a26cd336d0fe784fb7995f6e5c9e3776258',
        to: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        data,
        value: '0',
    });

    it('returns a zero-amount revoke calldata for a needs_revoke quote (USDT with existing allowance)', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: USDT_CRYPTO_ID,
            preapprovedStringAmount: '0.001',
            status: 'APPROVAL_REQ' as const,
            dexTx: buildDexTx(approveData),
        };

        const result = getDexEstimationData(quote);
        expect(result).toBe(buildApprovalTransactionData({ spender, amount: '0' }));
        expect(result).not.toBe(approveData);
    });

    it('returns dexTx.data unchanged for a needs_increase quote (standard token supports increasing)', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: DAI_CRYPTO_ID,
            preapprovedStringAmount: '0.001',
            status: 'APPROVAL_REQ' as const,
            dexTx: buildDexTx(approveData),
        };

        expect(getDexEstimationData(quote)).toBe(approveData);
    });

    it('returns undefined when the quote has no dexTx', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: USDT_CRYPTO_ID,
        };

        expect(getDexEstimationData(quote)).toBeUndefined();
    });
});

describe('hasEip712SignDataType', () => {
    it('should return false when no quote is provided', () => {
        expect(hasEip712SignDataType(undefined)).toBe(false);
    });

    it('should return false for a CEX quote without signData', () => {
        const quote = { orderId: 'test-order', isDex: false };
        expect(hasEip712SignDataType(quote)).toBe(false);
    });

    it('should return false for a non-fusion DEX quote without signData', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId,
        };
        expect(hasEip712SignDataType(quote)).toBe(false);
    });

    it('should return true for a quote with EIP-712 signData regardless of status', () => {
        const quote = {
            orderId: 'test-order',
            exchange: '1inchfusion',
            isDex: true,
            signData: {
                type: 'eip712-typed-data' as const,
                data: { primaryType: 'Order' },
            },
        };
        expect(hasEip712SignDataType(quote)).toBe(true);
    });
});

describe('getDisplayNetworkFee', () => {
    it('should return the original fee for a non-gasless quote', () => {
        const quote = { orderId: 'test-order', isDex: false };
        expect(getDisplayNetworkFee(quote, '12345')).toBe('12345');
    });

    it('should return "0" for an EIP-712-signed (gasless) quote', () => {
        const quote = {
            orderId: 'test-order',
            exchange: '1inchfusion',
            isDex: true,
            signData: {
                type: 'eip712-typed-data' as const,
                data: { primaryType: 'Order' },
            },
        };
        expect(getDisplayNetworkFee(quote, '12345')).toBe('0');
    });
});

describe('getDisplayComposedLevels', () => {
    const gaslessQuote = {
        orderId: 'test-order',
        exchange: '1inchfusion',
        isDex: true,
        signData: {
            type: 'eip712-typed-data' as const,
            data: { primaryType: 'Order' },
        },
    };

    const composedLevels = {
        normal: { type: 'final', fee: '12345' },
        high: { type: 'nonfinal', fee: '67890' },
        custom: { type: 'error', error: 'NOT_ENOUGH_FUNDS' },
    } as unknown as PrecomposedLevels;

    it('should return undefined when composedLevels is undefined', () => {
        expect(getDisplayComposedLevels(gaslessQuote, undefined)).toBe(undefined);
    });

    it('should return undefined when both quote and composedLevels are undefined', () => {
        expect(getDisplayComposedLevels(undefined, undefined)).toBe(undefined);
    });

    it('should return the original levels when quote is undefined', () => {
        expect(getDisplayComposedLevels(undefined, composedLevels)).toBe(composedLevels);
    });

    it('should return the original levels for a non-gasless quote', () => {
        const quote = { orderId: 'test-order', isDex: false };
        expect(getDisplayComposedLevels(quote, composedLevels)).toBe(composedLevels);
    });

    it('should return the original levels for a non-gasless DEX quote', () => {
        const quote = {
            orderId: 'test-order',
            isDex: true,
            send: 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId,
        };
        expect(getDisplayComposedLevels(quote, composedLevels)).toBe(composedLevels);
    });

    it('should zero the fee on all levels, replacing error levels with a zero-fee nonfinal level', () => {
        expect(getDisplayComposedLevels(gaslessQuote, composedLevels)).toEqual({
            normal: { type: 'final', fee: '0' },
            high: { type: 'nonfinal', fee: '0' },
            custom: { type: 'nonfinal', fee: '0' },
        });
    });
});

describe('deriveBitcoinSwapFromAddresses', () => {
    const account = {
        networkType: 'bitcoin',
        addresses: {
            unused: [{ address: 'unused-address', path: "m/44'/0'/0'/0/0" }],
            used: [{ address: 'used-address', path: "m/44'/0'/0'/0/1" }],
            change: [{ address: 'change-address', path: "m/44'/0'/0'/1/0" }],
        },
        utxo: [{ address: 'used-address', path: "m/44'/0'/0'/0/1", txid: 'abc', vout: 0 }],
        availableBalance: '10000',
        path: "m/44'/0'/0'",
    } as unknown as Account;

    const network = {
        symbol: 'btc',
        decimals: 8,
    } as unknown as Network;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return undefined if btcSwapDummyData is not provided', async () => {
        const result = await deriveBitcoinSwapFromAddresses({
            account,
            network,
            sendStringAmount: '0.0001',
            decimals: 8,
        });

        expect(result).toBeUndefined();
    });

    it('should calculate swap from address with default mock config', async () => {
        (TrezorConnect.composeTransaction as jest.Mock).mockResolvedValue({
            success: true,
            payload: [
                {
                    type: 'final',
                    inputs: [{ prev_hash: 'abc', prev_index: 0 }],
                    outputs: [{ amount: '5000' }],
                },
            ],
        });

        const result = await deriveBitcoinSwapFromAddresses({
            account,
            network,
            sendStringAmount: '0.0001',
            decimals: 8,
            btcSwapDummyData: {
                opreturn: {
                    dataHex:
                        '3078306632656166663639313734646264333963366533346661366465653966326266626566663363313139366462303666636238356339313364376531663466643d7c6c6966696351',
                },
                feePercentage: 2,
            },
        });

        expect(result).toEqual({
            addresses: ['used-address'],
            amount: '5000',
        });
        expect(TrezorConnect.composeTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                outputs: expect.arrayContaining([
                    expect.objectContaining({
                        type: 'opreturn',
                        dataHex:
                            '3078306632656166663639313734646264333963366533346661366465653966326266626566663363313139366462303666636238356339313364376531663466643d7c6c6966696351',
                    }),
                    expect.objectContaining({
                        type: 'payment',
                        amount: '200',
                        address: 'unused-address',
                    }),
                ]),
            }),
        );
    });

    it('should calculate swap from address with custom btcSwapDummyData config', async () => {
        (TrezorConnect.composeTransaction as jest.Mock).mockResolvedValue({
            success: true,
            payload: [
                {
                    type: 'final',
                    inputs: [{ prev_hash: 'abc', prev_index: 0 }],
                    outputs: [{ amount: '4000' }],
                },
            ],
        });

        const result = await deriveBitcoinSwapFromAddresses({
            account,
            network,
            sendStringAmount: '0.0001',
            decimals: 8,
            btcSwapDummyData: {
                opreturn: {
                    dataHex: 'custom_opreturn',
                },
                feePercentage: 5,
            },
        });

        expect(result).toEqual({
            addresses: ['used-address'],
            amount: '4000',
        });
        expect(TrezorConnect.composeTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                outputs: expect.arrayContaining([
                    expect.objectContaining({
                        type: 'opreturn',
                        dataHex: 'custom_opreturn',
                    }),
                    expect.objectContaining({
                        type: 'payment',
                        amount: '500',
                        address: 'unused-address',
                    }),
                ]),
            }),
        );
    });
});
