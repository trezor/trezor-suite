import { Calldata, asEvmAddress } from '@suite-common/calldata';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { WRAPPED_NATIVE, asNetworkSymbol } from '@suite-common/wallet-config';
import { type StablecoinYieldActionReviewState } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';
import { BigNumber } from '@trezor/utils';

import { buildYieldReviewPreview } from './yieldReviewOutputUtils';

const ethSymbol = asNetworkSymbol('eth');
const WETH = WRAPPED_NATIVE.eth!;

const account = mockWalletAccount({ symbol: ethSymbol }) as Account;

const buildUnsignedTransaction = (data: string, value?: string) =>
    JSON.stringify({
        from: '0x1111111111111111111111111111111111111111',
        to: WETH.address,
        data,
        chainId: 1,
        gasLimit: '0x7530',
        nonce: '0x1',
        maxFeePerGas: '0x3b9aca00',
        maxPriorityFeePerGas: '0x3b9aca00',
        ...(value ? { value } : {}),
    });

const nativeToken = {
    networkSymbol: ethSymbol,
    symbol: 'ETH',
    decimals: 18,
    contractAddress: null,
};

const wrappedNativeToken = {
    networkSymbol: ethSymbol,
    symbol: WETH.symbol,
    decimals: WETH.decimals,
    contractAddress: WETH.address,
};

const t1b1Device = mockSuiteDevice(undefined, {
    internal_model: DeviceModelInternal.T1B1,
    major_version: 1,
    minor_version: 13,
    patch_version: 0,
});

describe('buildYieldReviewPreview', () => {
    // T1B1 firmware is 1.x, so it always blind-signs the wrap/unwrap through the legacy review
    // flow. Its outputs still have to stay within the types the earn review renders, otherwise
    // the preview is discarded and the review screen renders blank.
    it.each([
        {
            flowType: 'wrap' as const,
            reviewToken: nativeToken,
            unsignedTransaction: buildUnsignedTransaction('0xd0e30db0', '0xde0b6b3a7640000'),
        },
        {
            flowType: 'unwrap' as const,
            reviewToken: wrappedNativeToken,
            unsignedTransaction: buildUnsignedTransaction(`0x2e1a7d4d${'00'.repeat(32)}`),
        },
    ])(
        'builds a $flowType preview for a T1B1 device',
        ({ flowType, reviewToken, unsignedTransaction }) => {
            const preview = buildYieldReviewPreview({
                account,
                device: t1b1Device,
                review: { amount: '1', unsignedTransaction },
                reviewToken,
                type: flowType,
            });

            expect(preview?.evmTransactionPurpose).toBe(flowType);
            expect(preview?.outputs.map(output => output.type)).toEqual(['regular_legacy', 'data']);
        },
    );

    // A claim review that cannot be built is reported to the user as "reward details didn't match
    // the transaction", so the legacy T1B1 outputs have to stay within the rendered types too.
    it('builds a claim preview for a T1B1 device', () => {
        const claimUser = asEvmAddress('0x1111111111111111111111111111111111111111');
        const rewardToken = asEvmAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
        const claimData = Calldata.evm.distributor.claim.encode(
            {
                users: [claimUser],
                tokens: [rewardToken],
                amounts: [new BigNumber(1)],
                proofs: [[]],
            },
            { sender: claimUser },
        ).data;
        const review = {
            type: 'claim',
            rewards: [
                {
                    token: {
                        networkSymbol: ethSymbol,
                        symbol: 'USDC',
                        decimals: 6,
                        contractAddress: rewardToken,
                    },
                    value: '1',
                    fiatValue: '1',
                },
            ],
            unsignedTransaction: {
                to: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
                data: claimData,
                chainId: 1,
                gasLimit: '21000',
                maxFeePerGas: '2000000000',
                maxPriorityFeePerGas: '1000000000',
                nonce: '10',
            },
        } as Extract<StablecoinYieldActionReviewState, { type: 'claim' }>;

        const preview = buildYieldReviewPreview({
            account,
            device: t1b1Device,
            review,
            type: 'claim',
        });

        expect(preview?.evmTransactionPurpose).toBe('claim');
        expect(preview?.outputs.map(output => output.type)).toEqual(['regular_legacy', 'data']);
    });
});
