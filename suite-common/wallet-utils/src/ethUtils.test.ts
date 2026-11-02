import { UINT256_MAX } from '@suite-common/suite-constants';
import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type PrecomposedTransactionFinal,
    type WalletAccountTransaction,
    toTokenAddress,
} from '@suite-common/wallet-types';
import { mockAccountToken } from '@suite-common/wallet-types/mocks';
import { Calldata, asEvmAddress } from '@trezor/network-ethereum-suite-common';
import { BigNumber } from '@trezor/utils';

import {
    buildApprovalTransactionData,
    getEffectiveGasPrice,
    getEvmTransactionPurpose,
    getEvmTransactionTextSignature,
    getNativeWrapTxKind,
    getPrecomposedTxWithAccountToken,
    getUnwrapAmountByEthereumDataHex,
    getWrappedNativeTxTarget,
    isUnwrapNativeTx,
    isWrapNativeTx,
    isYieldVaultTx,
    padLeftEven,
    sanitizeHex,
    strip,
} from './ethUtils';

const ethSymbol = asNetworkSymbol('eth');

const VALID_CLAIM_ADDRESS = asEvmAddress('0x1111111111111111111111111111111111111111');

describe('eth utils', () => {
    it('padLeftEven', () => {
        // TODO: add more tests
        expect(padLeftEven('2540be3ff')).toBe('02540be3ff');
    });

    it('sanitizeHex', () => {
        expect(sanitizeHex('0x2540be3ff')).toBe('0x02540be3ff');
        expect(sanitizeHex('1')).toBe('0x01');
        expect(sanitizeHex('2')).toBe('0x02');
        expect(sanitizeHex('100')).toBe('0x0100');
        expect(sanitizeHex('999')).toBe('0x0999');
        expect(sanitizeHex('')).toBe('');
    });

    it('strip', () => {
        expect(strip('0x')).toBe('');
        expect(strip('0x2540be3ff')).toBe('02540be3ff');
        expect(strip('2540be3ff')).toBe('02540be3ff');
    });

    describe('getEffectiveGasPrice', () => {
        it('returns effectiveGasPrice when present and greater than zero', () => {
            expect(
                getEffectiveGasPrice({ effectiveGasPrice: '150000000', gasPrice: '1000000000' }),
            ).toBe('150000000');
        });

        it('falls back to gasPrice when effectiveGasPrice is zero', () => {
            expect(getEffectiveGasPrice({ effectiveGasPrice: '0', gasPrice: '1000000000' })).toBe(
                '1000000000',
            );
        });

        it('falls back to gasPrice when effectiveGasPrice is undefined', () => {
            expect(getEffectiveGasPrice({ gasPrice: '1000000000' })).toBe('1000000000');
        });

        it('returns "0" when neither value is defined', () => {
            expect(getEffectiveGasPrice({})).toBe('0');
            expect(getEffectiveGasPrice(undefined)).toBe('0');
        });
    });

    describe('getEvmTransactionTextSignature', () => {
        it('should return "" when data is undefined or empty string', () => {
            expect(getEvmTransactionTextSignature(undefined)).toBe('');
            expect(getEvmTransactionTextSignature('')).toBe('');
        });

        it('should return "transfer" for non-approval transaction data', () => {
            const randomData = '0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d40e5';
            expect(getEvmTransactionTextSignature(randomData)).toBe('unknown');
        });

        it('should return "approval" for approve transaction with non-zero amount', () => {
            const approveData =
                '0x095ea7b3' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' + // spender
                '0000000000000000000000000000000000000000000000000de0b6b3a7640000'; // amount (32 bytes) - 1 ETH in wei

            expect(getEvmTransactionTextSignature(approveData)).toBe('approve');
        });

        it('should return "revoke" for approve transaction with zero amount', () => {
            const revokeData =
                '0x095ea7b3' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' + // spender
                '0000000000000000000000000000000000000000000000000000000000000000'; // amount (32 bytes) - 0

            expect(getEvmTransactionTextSignature(revokeData)).toBe('revoke');
        });

        it('should return "approval" for maximum uint256 approval', () => {
            const maxApprovalData =
                '0x095ea7b3' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' + // spender
                'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'; // max uint256

            expect(getEvmTransactionTextSignature(maxApprovalData)).toBe('approve');
        });

        it('should return "unknown" for data that starts with approve selector but is too short', () => {
            const shortData = '0x095ea7b3';
            expect(getEvmTransactionTextSignature(shortData)).toBe('unknown');
        });

        it('keeps WETH wrap calldata "unknown" — classifying it needs the tx target', () => {
            expect(getEvmTransactionTextSignature('0xd0e30db0')).toBe('unknown');
        });

        it('should return "unknown" for data that starts with approve selector but has invalid parameters', () => {
            const invalidData = '0x095ea7b3' + '000000000000000000000000742d35cc';
            expect(getEvmTransactionTextSignature(invalidData)).toBe('unknown');
        });

        it('should handle data without 0x prefix', () => {
            const dataWithoutPrefix =
                '095ea7b3' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' +
                '0000000000000000000000000000000000000000000000000de0b6b3a7640000';

            expect(getEvmTransactionTextSignature(dataWithoutPrefix)).toBe('approve');
        });

        it('should handle uppercase hex data', () => {
            const uppercaseData =
                '0X095EA7B3' +
                '000000000000000000000000742D35CC6634C0532925A3B8D40E592E43A73654' +
                '0000000000000000000000000000000000000000000000000000000000000000';

            expect(getEvmTransactionTextSignature(uppercaseData)).toBe('revoke');
        });

        it('should return "unknown" text signature for unknown method call', () => {
            const similarData =
                '0x095ea7b4' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' +
                '0000000000000000000000000000000000000000000000000de0b6b3a7640000';

            expect(getEvmTransactionTextSignature(similarData)).toBe('unknown');
        });

        it('returns "transfer" for valid transfer call', () => {
            const data =
                '0xa9059cbb' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' +
                '00000000000000000000000000000000000000000000000000000000000003e8';
            expect(getEvmTransactionTextSignature(data)).toBe('transfer');
        });

        it('returns "unknown" for selector-only transfer (too short)', () => {
            expect(getEvmTransactionTextSignature('0xa9059cbb')).toBe('unknown');
        });

        it('returns "unknown" for "0x" input (not empty but no known selector)', () => {
            expect(getEvmTransactionTextSignature('0x')).toBe('unknown');
        });

        it('returns "unknown" for random data not matching known selectors', () => {
            const random =
                '0x12345678' +
                '0000000000000000000000001111111111111111111111111111111111111111' +
                '0000000000000000000000000000000000000000000000000000000000000001';
            expect(getEvmTransactionTextSignature(random)).toBe('unknown');
        });

        it('handles uppercase without 0x prefix for transfer', () => {
            const upperNoPrefix =
                'A9059CBB' +
                '000000000000000000000000742D35CC6634C0532925A3B8D40E592E43A73654' +
                '00000000000000000000000000000000000000000000000000000000000003E8';
            expect(getEvmTransactionTextSignature(upperNoPrefix)).toBe('transfer');
        });

        it('returns "claim" for valid distributor claim call', () => {
            const claimData = Calldata.evm.distributor.claim.encode(
                {
                    users: [VALID_CLAIM_ADDRESS],
                    tokens: [VALID_CLAIM_ADDRESS],
                    amounts: [new BigNumber(1)],
                    proofs: [[]],
                },
                { sender: VALID_CLAIM_ADDRESS },
            ).data;

            expect(getEvmTransactionTextSignature(claimData ?? undefined)).toBe('claim');
        });
    });

    describe('getEvmTransactionPurpose', () => {
        const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        const OTHER = '0x1111111111111111111111111111111111111111';
        const WRAP_DATA = '0xd0e30db0';
        const UNWRAP_DATA =
            '0x2e1a7d4d0000000000000000000000000000000000000000000000000de0b6b3a7640000';

        it('classifies WETH calldata as wrap/unwrap when the target is the wrapped-native contract', () => {
            expect(
                getEvmTransactionPurpose({
                    networkSymbol: ethSymbol,
                    to: WETH,
                    data: WRAP_DATA,
                }),
            ).toBe('wrap');
            expect(
                getEvmTransactionPurpose({
                    networkSymbol: ethSymbol,
                    to: WETH,
                    data: UNWRAP_DATA,
                }),
            ).toBe('unwrap');
        });

        it('keeps WETH calldata "unknown" for a non-wrapped-native target', () => {
            expect(
                getEvmTransactionPurpose({
                    networkSymbol: ethSymbol,
                    to: OTHER,
                    data: WRAP_DATA,
                }),
            ).toBe('unknown');
        });

        it('falls back to the calldata text signature', () => {
            const approveData =
                '0x095ea7b3' +
                '000000000000000000000000742d35cc6634c0532925a3b8d40e592e43a73654' +
                '0000000000000000000000000000000000000000000000000de0b6b3a7640000';

            expect(
                getEvmTransactionPurpose({
                    networkSymbol: ethSymbol,
                    to: OTHER,
                    data: approveData,
                }),
            ).toBe('approve');
        });

        it('returns "unknown" for selector-only claim (too short)', () => {
            expect(getEvmTransactionTextSignature('0x71ee95c0')).toBe('unknown');
        });
    });

    describe('wrapped-native tx detection', () => {
        const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        const OTHER = '0x1111111111111111111111111111111111111111';
        const DEPOSIT = '0xd0e30db0'; // WETH deposit()
        const WITHDRAW =
            '0x2e1a7d4d0000000000000000000000000000000000000000000000000de0b6b3a7640000'; // withdraw(1e18)
        const ERC4626_DEPOSIT =
            '0x6e553f65' + // deposit(uint256,address) — different selector, must not be treated as a wrap
            '00000000000000000000000000000000000000000000000000000000004c4b40' +
            '0000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae3';

        const wrap = (to: string | null, data: string | null) =>
            isWrapNativeTx({ networkSymbol: ethSymbol, to, data });
        const unwrap = (to: string | null, data: string | null) =>
            isUnwrapNativeTx({ networkSymbol: ethSymbol, to, data });

        it('isWrapNativeTx detects deposit() to the wrapped-native contract', () => {
            expect(wrap(WETH, DEPOSIT)).toBe(true);
        });

        it('isWrapNativeTx ignores deposit() to a non-WETH contract (target guard)', () => {
            expect(wrap(OTHER, DEPOSIT)).toBe(false);
        });

        it('isWrapNativeTx ignores other selectors on the WETH contract', () => {
            expect(wrap(WETH, WITHDRAW)).toBe(false);
            expect(wrap(WETH, ERC4626_DEPOSIT)).toBe(false);
        });

        it('isWrapNativeTx returns false for a missing target or data', () => {
            expect(wrap(null, DEPOSIT)).toBe(false);
            expect(wrap(WETH, null)).toBe(false);
        });

        it('isUnwrapNativeTx detects withdraw() to the wrapped-native contract', () => {
            expect(unwrap(WETH, WITHDRAW)).toBe(true);
        });

        it('isUnwrapNativeTx ignores withdraw() to a non-WETH contract', () => {
            expect(unwrap(OTHER, WITHDRAW)).toBe(false);
        });

        it('isUnwrapNativeTx ignores the deposit() selector', () => {
            expect(unwrap(WETH, DEPOSIT)).toBe(false);
        });

        it('getUnwrapAmountByEthereumDataHex returns the wad amount for withdraw()', () => {
            expect(getUnwrapAmountByEthereumDataHex(WITHDRAW)).toBe('1000000000000000000');
        });

        it('getUnwrapAmountByEthereumDataHex returns null for non-withdraw data', () => {
            expect(getUnwrapAmountByEthereumDataHex(DEPOSIT)).toBe(null);
            expect(getUnwrapAmountByEthereumDataHex('0xdeadbeef')).toBe(null);
            expect(getUnwrapAmountByEthereumDataHex(undefined)).toBe(null);
        });
    });

    describe('getNativeWrapTxKind', () => {
        const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        const OTHER = '0x1111111111111111111111111111111111111111';
        const DEPOSIT = '0xd0e30db0';
        const WITHDRAW =
            '0x2e1a7d4d0000000000000000000000000000000000000000000000000de0b6b3a7640000';
        type TxParams = {
            targets?: { addresses?: string[] }[];
            internalTransfers?: { from: string }[];
            data?: string;
        };

        const tx = ({ targets = [], internalTransfers = [], data }: TxParams) =>
            ({
                symbol: 'eth',
                targets,
                internalTransfers,
                ethereumSpecific: data ? { data } : undefined,
            }) as unknown as WalletAccountTransaction;

        it('detects a wrap when the WETH contract is the value target', () => {
            expect(
                getNativeWrapTxKind(tx({ targets: [{ addresses: [WETH] }], data: DEPOSIT })),
            ).toBe('wrap');
        });

        it('detects an unwrap when the WETH contract is the internal ETH sender', () => {
            expect(
                getNativeWrapTxKind(tx({ internalTransfers: [{ from: WETH }], data: WITHDRAW })),
            ).toBe('unwrap');
        });

        it('ignores a deposit() to a non-WETH contract', () => {
            expect(
                getNativeWrapTxKind(tx({ targets: [{ addresses: [OTHER] }], data: DEPOSIT })),
            ).toBeUndefined();
        });

        it('ignores a WETH interaction with an unrelated selector', () => {
            expect(
                getNativeWrapTxKind(tx({ targets: [{ addresses: [WETH] }], data: '0xdeadbeef' })),
            ).toBeUndefined();
        });

        it('returns undefined without a WETH target or data', () => {
            expect(getNativeWrapTxKind(tx({}))).toBeUndefined();
        });
    });

    describe('isYieldVaultTx', () => {
        const VAULT = toTokenAddress('0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB');
        const OTHER_VAULT = '0x8eb67a509616cd6a7c1b3c8c21d48ff57df3d458';
        const ROUTER = '0x4095f064b8d3c3548a3bebfd0bbfd04750e30077';
        const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        const RECEIVER = '0000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae3';
        const AMOUNT = '00000000000000000000000000000000000000000000000000000000004c4b40';

        const WETH_DEPOSIT = '0xd0e30db0';
        const ERC4626_DEPOSIT = `0x6e553f65${AMOUNT}${RECEIVER}`;
        const ERC4626_WITHDRAW = `0xb460af94${AMOUNT}${RECEIVER}${RECEIVER}`;
        const ERC4626_REDEEM = `0xba087652${AMOUNT}${RECEIVER}${RECEIVER}`;
        const TRANSFER = `0xa9059cbb${RECEIVER}${AMOUNT}`;

        type VaultTxParams = {
            callTarget: string;
            data: string;
            shareTokenContract?: string;
        };

        const vaultTx = ({ callTarget, data, shareTokenContract }: VaultTxParams) =>
            testMocks.getWalletTransaction({
                symbol: ethSymbol,
                ethereumSpecific: { status: 1, nonce: 0, gasLimit: 200000, data },
                details: {
                    vin: [],
                    vout: [{ n: 0, isAddress: true, addresses: [callTarget] }],
                    size: 0,
                    totalInput: '0',
                    totalOutput: '0',
                },
                tokens: shareTokenContract
                    ? [
                          {
                              type: 'recv',
                              amount: '1',
                              from: '0x0000000000000000000000000000000000000000',
                              to: `0x${RECEIVER.slice(24)}`,
                              contract: shareTokenContract,
                              decimals: 18,
                          },
                      ]
                    : [],
            });

        it('detects deposit/withdraw/redeem calls to the vault', () => {
            const callTarget = VAULT.toLowerCase();

            expect(isYieldVaultTx(vaultTx({ callTarget, data: ERC4626_DEPOSIT }), VAULT)).toBe(
                true,
            );
            expect(isYieldVaultTx(vaultTx({ callTarget, data: ERC4626_WITHDRAW }), VAULT)).toBe(
                true,
            );
            expect(isYieldVaultTx(vaultTx({ callTarget, data: ERC4626_REDEEM }), VAULT)).toBe(true);
        });

        it('detects a vault call made through another contract by its share token transfer', () => {
            const transaction = vaultTx({
                callTarget: ROUTER,
                data: ERC4626_DEPOSIT,
                shareTokenContract: VAULT.toLowerCase(),
            });

            expect(isYieldVaultTx(transaction, VAULT)).toBe(true);
        });

        it('ignores calls to another vault', () => {
            const transaction = vaultTx({
                callTarget: OTHER_VAULT,
                data: ERC4626_DEPOSIT,
                shareTokenContract: OTHER_VAULT,
            });

            expect(isYieldVaultTx(transaction, VAULT)).toBe(false);
        });

        it('ignores vault share token transfers and other calls to the vault', () => {
            expect(
                isYieldVaultTx(
                    vaultTx({ callTarget: VAULT, data: TRANSFER, shareTokenContract: VAULT }),
                    VAULT,
                ),
            ).toBe(false);
            expect(isYieldVaultTx(vaultTx({ callTarget: VAULT, data: '0xdeadbeef' }), VAULT)).toBe(
                false,
            );
            expect(isYieldVaultTx(vaultTx({ callTarget: VAULT, data: '0x' }), VAULT)).toBe(false);
        });

        it('ignores wrap transactions of the yield flow', () => {
            expect(isYieldVaultTx(vaultTx({ callTarget: WETH, data: WETH_DEPOSIT }), VAULT)).toBe(
                false,
            );
        });
    });

    describe('getWrappedNativeTxTarget', () => {
        const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        const OTHER = '0x1111111111111111111111111111111111111111';
        type TxParams = {
            targets?: { addresses?: string[] }[];
            internalTransfers?: { from: string }[];
        };

        const tx = ({ targets = [], internalTransfers = [] }: TxParams) =>
            ({
                symbol: 'eth',
                targets,
                internalTransfers,
            }) as unknown as WalletAccountTransaction;

        it('finds the WETH contract among the value targets', () => {
            expect(getWrappedNativeTxTarget(tx({ targets: [{ addresses: [WETH] }] }))).toBe(WETH);
        });

        it('finds the WETH contract among the internal ETH senders', () => {
            expect(getWrappedNativeTxTarget(tx({ internalTransfers: [{ from: WETH }] }))).toBe(
                WETH,
            );
        });

        it('returns undefined for a transaction not touching the WETH contract', () => {
            expect(
                getWrappedNativeTxTarget(tx({ targets: [{ addresses: [OTHER] }] })),
            ).toBeUndefined();
        });
    });

    describe('buildApprovalTransactionData', () => {
        const VALID_SPENDER = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

        it('builds correct calldata for a valid approval', () => {
            const result = buildApprovalTransactionData({
                amount: '1000000000000000000',
                spender: VALID_SPENDER,
            });

            expect(result).toBe(
                '0x095ea7b3' +
                    '000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e' +
                    '0000000000000000000000000000000000000000000000000de0b6b3a7640000',
            );
        });

        it('builds correct calldata for zero amount (revoke)', () => {
            const result = buildApprovalTransactionData({
                amount: '0',
                spender: VALID_SPENDER,
            });

            expect(result).toBe(
                '0x095ea7b3' +
                    '000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e' +
                    '0000000000000000000000000000000000000000000000000000000000000000',
            );
        });

        it('builds correct calldata for max uint256 (infinite approval)', () => {
            const maxUint256Decimal = new BigNumber(UINT256_MAX).toString(10);
            const result = buildApprovalTransactionData({
                amount: maxUint256Decimal,
                spender: VALID_SPENDER,
            });

            expect(result).toBe(
                '0x095ea7b3' +
                    '000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e' +
                    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
            );
        });

        it.each([
            ['wrong length', '0x742d35cc6634c0532925a3b844bc454e4438f44'],
            ['non-hex characters', '0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ'],
            ['empty string', ''],
        ])('throws for invalid spender address (%s)', (_, spender) => {
            expect(() => buildApprovalTransactionData({ amount: '1000', spender })).toThrow();
        });

        it.each([
            ['negative', '-1'],
            ['non-numeric', 'abc'],
            ['decimal', '1.5'],
            ['exceeds uint256 max', new BigNumber(UINT256_MAX).plus(1).toString(10)],
        ])('throws for invalid amount (%s)', (_, amount) => {
            expect(() =>
                buildApprovalTransactionData({ amount, spender: VALID_SPENDER }),
            ).toThrow();
        });

        it('produces calldata that the calldata decoder can decode', () => {
            const amount = '1000000000000000000';
            const calldata = buildApprovalTransactionData({
                amount,
                spender: VALID_SPENDER,
            });

            const decoded = Calldata.evm.erc20.approve.decode(calldata);

            expect(decoded).not.toBeNull();
            expect(decoded?.spender).toBe(VALID_SPENDER.toLowerCase());
            expect(decoded?.amount.toString()).toBe(amount);
        });
    });

    describe('getPrecomposedTxWithAccountToken', () => {
        const TOKEN_CONTRACT = '0x128cC466B61f542da60c70e3aA11c10e19B84EDB';
        const RECIPIENT = '0x000000000000000000000000000000000000abcd';
        const TRANSFER_AMOUNT = '1500000';
        const TRANSFER_DATA = `a9059cbb${RECIPIENT.slice(2).padStart(64, '0')}${BigInt(
            TRANSFER_AMOUNT,
        )
            .toString(16)
            .padStart(64, '0')}`;
        const accountToken = mockAccountToken({
            contract: TOKEN_CONTRACT.toLowerCase(),
            symbol: 'TKN',
            decimals: 6,
            balance: '5000000',
        });

        // The shape connect returns for a transfer of a token without a firmware definition:
        // the contract stands in for the recipient and no value moves.
        const buildContractCallPrecomposedTx = (): PrecomposedTransactionFinal => ({
            type: 'final',
            inputs: [],
            outputsPermutation: [0],
            outputs: [{ address: TOKEN_CONTRACT, amount: '0', script_type: 'PAYTOADDRESS' }],
            totalSpent: '42000',
            fee: '42000',
            feePerByte: '20',
            bytes: 0,
            max: undefined,
            isTokenKnown: false,
        });

        it('decodes a transfer of an account token connect has no definition for', () => {
            const result = getPrecomposedTxWithAccountToken({
                precomposedTx: buildContractCallPrecomposedTx(),
                contract: TOKEN_CONTRACT,
                data: TRANSFER_DATA,
                accountTokens: [accountToken],
            });

            expect(result).toMatchObject({
                outputs: [{ address: RECIPIENT, amount: TRANSFER_AMOUNT }],
                totalSpent: TRANSFER_AMOUNT,
                fee: '42000',
                token: accountToken,
                isTokenKnown: false,
            });
        });

        it('accepts 0x-prefixed calldata', () => {
            const result = getPrecomposedTxWithAccountToken({
                precomposedTx: buildContractCallPrecomposedTx(),
                contract: TOKEN_CONTRACT,
                data: `0x${TRANSFER_DATA}`,
                accountTokens: [accountToken],
            });

            expect(result.token).toBe(accountToken);
        });

        it('keeps a transaction connect already decoded from a token definition', () => {
            const precomposedTx: PrecomposedTransactionFinal = {
                ...buildContractCallPrecomposedTx(),
                outputs: [
                    { address: RECIPIENT, amount: TRANSFER_AMOUNT, script_type: 'PAYTOADDRESS' },
                ],
                token: accountToken,
                isTokenKnown: true,
            };

            expect(
                getPrecomposedTxWithAccountToken({
                    precomposedTx,
                    contract: TOKEN_CONTRACT,
                    data: TRANSFER_DATA,
                    accountTokens: [accountToken],
                }),
            ).toBe(precomposedTx);
        });

        it.each([
            ['the account does not hold the token', [], TRANSFER_DATA, TOKEN_CONTRACT],
            ['the calldata is not a transfer', [accountToken], 'deadbeef', TOKEN_CONTRACT],
            ['there is no contract', [accountToken], TRANSFER_DATA, undefined],
        ])('keeps the transaction when %s', (_, accountTokens, data, contract) => {
            const precomposedTx = buildContractCallPrecomposedTx();

            expect(
                getPrecomposedTxWithAccountToken({ precomposedTx, contract, data, accountTokens }),
            ).toBe(precomposedTx);
        });

        it('keeps the transaction when it also sends native value', () => {
            const precomposedTx: PrecomposedTransactionFinal = {
                ...buildContractCallPrecomposedTx(),
                outputs: [{ address: TOKEN_CONTRACT, amount: '1', script_type: 'PAYTOADDRESS' }],
            };

            expect(
                getPrecomposedTxWithAccountToken({
                    precomposedTx,
                    contract: TOKEN_CONTRACT,
                    data: TRANSFER_DATA,
                    accountTokens: [accountToken],
                }),
            ).toBe(precomposedTx);
        });
    });
});
