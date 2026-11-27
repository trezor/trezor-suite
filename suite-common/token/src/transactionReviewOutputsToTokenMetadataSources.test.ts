import { toTokenAddress } from '@suite-common/tokens';
import { type TransactionReviewOutput } from '@suite-common/wallet-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { transactionReviewOutputsToTokenMetadataSources } from './transactionReviewOutputsToTokenMetadataSources';

const eth = asNetworkSymbol('eth');
const amountOutput: TransactionReviewOutput = {
    type: 'amount',
    value: '1000000',
    token: {
        standard: 'ERC20',
        contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
    },
};
const rewardsOutput: TransactionReviewOutput = {
    type: 'rewards',
    rewards: [
        {
            tokenAddress: '0x1111111111111111111111111111111111111111',
            tokenSymbol: 'MORPHO',
        },
    ],
};

describe('transactionReviewOutputsToTokenMetadataSources', () => {
    it('collects the output tokens and reward tokens of one network', () => {
        expect(
            transactionReviewOutputsToTokenMetadataSources(eth, [
                amountOutput,
                { type: 'address', value: '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3' },
                rewardsOutput,
            ]),
        ).toStrictEqual([
            {
                networkSymbol: eth,
                tokens: [
                    {
                        ...amountOutput.token,
                        contract: toTokenAddress(amountOutput.token!.contract),
                    },
                    {
                        contract: toTokenAddress('0x1111111111111111111111111111111111111111'),
                        symbol: 'MORPHO',
                    },
                ],
            },
        ]);
    });

    it('returns no sources without a network or outputs', () => {
        expect(transactionReviewOutputsToTokenMetadataSources(undefined, [amountOutput])).toEqual(
            [],
        );
        expect(transactionReviewOutputsToTokenMetadataSources(eth)).toEqual([
            { networkSymbol: eth, tokens: [] },
        ]);
    });
});
