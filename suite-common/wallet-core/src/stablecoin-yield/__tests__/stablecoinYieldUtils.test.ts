import { Calldata, asEvmAddress } from '@suite-common/calldata';

import {
    buildEvmSelectedFee,
    buildYieldWithdrawCalldata,
    buildYieldWithdrawUnsignedTransaction,
} from '../stablecoinYieldUtils';

const ACCOUNT_DESCRIPTOR = asEvmAddress('0x9ea3721b5bf3b64b4418c38b603154d2d597fae3');
const VAULT_ADDRESS = '0x58d97b57bb95320f9a05dc918aef65434969c2b2';

const account = {
    descriptor: ACCOUNT_DESCRIPTOR,
    networkType: 'ethereum',
};

const flowData = {
    account,
    vault: {
        chainId: 1,
        id: 'ethereum:1:0x58d97b57bb95320f9a05dc918aef65434969c2b2',
    },
    token: {
        balance: '0',
        contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        decimals: 6,
        networkSymbol: 'eth',
        symbol: 'USDC',
    },
    receiptToken: {
        contractAddress: VAULT_ADDRESS,
        decimals: 18,
        networkSymbol: 'eth',
        symbol: 'trUSDC',
    },
} as unknown as Parameters<typeof buildYieldWithdrawCalldata>[0]['flowData'];

describe('stablecoinYieldUtils', () => {
    describe('buildYieldWithdrawCalldata', () => {
        it('builds ERC4626 withdraw calldata for asset input', () => {
            const calldata = buildYieldWithdrawCalldata({
                amount: '10',
                flowData,
                ownerAddress: ACCOUNT_DESCRIPTOR,
                receiverAddress: ACCOUNT_DESCRIPTOR,
                withdrawInputUnit: 'asset',
            });

            expect(Calldata.evm.erc4626.withdraw.decode(calldata)).toEqual({
                assets: 10_000_000n,
                owner: ACCOUNT_DESCRIPTOR.toLowerCase(),
                receiver: ACCOUNT_DESCRIPTOR.toLowerCase(),
            });
        });

        it('builds ERC4626 redeem calldata for shares input', () => {
            const calldata = buildYieldWithdrawCalldata({
                amount: '10',
                flowData,
                ownerAddress: ACCOUNT_DESCRIPTOR,
                receiverAddress: ACCOUNT_DESCRIPTOR,
                withdrawInputUnit: 'shares',
            });

            expect(Calldata.evm.erc4626.redeem.decode(calldata)).toEqual({
                shares: 10_000_000_000_000_000_000n,
                owner: ACCOUNT_DESCRIPTOR.toLowerCase(),
                receiver: ACCOUNT_DESCRIPTOR.toLowerCase(),
            });
        });

        it('throws when calldata cannot be encoded', () => {
            expect(() =>
                buildYieldWithdrawCalldata({
                    amount: '10',
                    flowData,
                    ownerAddress: 'not-an-address' as unknown as Parameters<
                        typeof buildYieldWithdrawCalldata
                    >[0]['ownerAddress'],
                    receiverAddress: ACCOUNT_DESCRIPTOR,
                    withdrawInputUnit: 'asset',
                }),
            ).toThrow('Failed to encode withdraw calldata');
        });
    });

    describe('buildYieldWithdrawUnsignedTransaction', () => {
        const commonParams = {
            chainId: 1,
            data: '0x1234',
            gasLimit: '21000',
            from: ACCOUNT_DESCRIPTOR,
            nonce: 7,
            to: VAULT_ADDRESS,
        };

        it('builds legacy fee fields', () => {
            expect(
                buildYieldWithdrawUnsignedTransaction({
                    ...commonParams,
                    feeLevel: {
                        feePerUnit: '5',
                    },
                }),
            ).toEqual({
                chainId: 1,
                data: '0x1234',
                from: ACCOUNT_DESCRIPTOR,
                gasLimit: '0x5208',
                gasPrice: '0x12a05f200',
                nonce: 7,
                to: VAULT_ADDRESS,
                value: '0x0',
            });
        });

        it('builds EIP1559 fee fields', () => {
            expect(
                buildYieldWithdrawUnsignedTransaction({
                    ...commonParams,
                    feeLevel: {
                        feePerUnit: '5',
                        maxFeePerGas: '6',
                        maxPriorityFeePerGas: '1',
                    },
                }),
            ).toEqual({
                chainId: 1,
                data: '0x1234',
                from: ACCOUNT_DESCRIPTOR,
                gasLimit: '0x5208',
                maxFeePerGas: '0x165a0bc00',
                maxPriorityFeePerGas: '0x3b9aca00',
                nonce: 7,
                to: VAULT_ADDRESS,
                type: 2,
                value: '0x0',
            });
        });
    });

    it('builds EVM selected fee with base fee', () => {
        expect(
            buildEvmSelectedFee({
                feeLevel: {
                    baseFeePerGas: '4',
                    feePerUnit: '5',
                    maxFeePerGas: '6',
                    maxPriorityFeePerGas: '1',
                },
                gasLimit: '21000',
            }),
        ).toEqual({
            baseFeePerGas: '0xee6b2800',
            gasLimit: '0x5208',
            maxFeePerGas: '0x165a0bc00',
            maxPriorityFeePerGas: '0x3b9aca00',
            type: 'eip1559',
        });
    });
});
