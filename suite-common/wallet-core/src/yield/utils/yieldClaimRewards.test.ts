import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { getYieldClaimRewardsSnapshot } from './yieldClaimRewards';

const ethSymbol = asNetworkSymbol('eth');

const createReward = ({
    claimable,
    fiatClaimable,
}: {
    claimable: string;
    fiatClaimable: string | null;
}) => ({
    token: {
        address: '0x0000000000000000000000000000000000000001',
        symbol: 'USDC',
        decimals: 6,
    },
    claimable: asBaseCurrencyAmount(new BigNumber(claimable)),
    fiat: {
        claimable:
            fiatClaimable === null ? null : asBaseCurrencyAmount(new BigNumber(fiatClaimable)),
    },
});

describe('getYieldClaimRewardsSnapshot', () => {
    it('converts claimable subunits to display units and keeps the fiat value', () => {
        expect(
            getYieldClaimRewardsSnapshot({
                networkSymbol: ethSymbol,
                rewards: [createReward({ claimable: '1000000', fiatClaimable: '1.25' })],
            }),
        ).toEqual([
            {
                token: {
                    networkSymbol: ethSymbol,
                    symbol: 'USDC',
                    decimals: 6,
                    contractAddress: '0x0000000000000000000000000000000000000001',
                },
                value: '1',
                fiatValue: '1.25',
            },
        ]);
    });

    it('keeps the reward without a fiat value when its rate is missing', () => {
        const rewards = getYieldClaimRewardsSnapshot({
            networkSymbol: ethSymbol,
            rewards: [createReward({ claimable: '2500000', fiatClaimable: null })],
        });

        expect(rewards[0]?.value).toBe('2.5');
        expect(rewards[0]?.fiatValue).toBeNull();
    });
});
