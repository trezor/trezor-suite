import { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import { BACKUP_ETH_APY, STAKE_SYMBOLS } from 'src/constants/suite/ethStaking';
import { isTestnet } from '@suite-common/wallet-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';

export const useEverstakePoolStats = (symbol?: NetworkSymbol) => {
    const [poolStats, setPoolStats] = useState<{ ethApy: string; nextRewardPayout: number | null }>(
        {
            ethApy: '',
            nextRewardPayout: null,
        },
    );

    useEffect(() => {
        setPoolStats({
            ethApy: '',
            nextRewardPayout: null,
        });
    }, [symbol]);

    const [isPoolStatsLoading, setIsPoolStatsLoading] = useState(false);

    useEffect(() => {
        if (!symbol || !STAKE_SYMBOLS.includes(symbol)) return;

        const abortController = new AbortController();

        const getEverstakePoolStats = async () => {
            try {
                setIsPoolStatsLoading(true);

                const response = await fetch(
                    `https://eth-api-b2c${isTestnet(symbol) ? '-stage' : ''}.everstake.one/api/v1/stats`,
                    {
                        method: 'GET',
                        signal: abortController.signal,
                    },
                );

                const stats = await response.json();

                if (!response.ok) {
                    throw new Error(`${response.status} ${stats.message}`);
                }

                setPoolStats({
                    ethApy: new BigNumber(stats.apr)
                        .times(100)
                        .toPrecision(3, BigNumber.ROUND_DOWN),
                    nextRewardPayout: Math.ceil(stats.next_reward_payout_in / 60 / 60 / 24),
                });
            } catch (e) {
                setPoolStats({
                    ethApy: BACKUP_ETH_APY,
                    nextRewardPayout: null,
                });
                if (!abortController.signal.aborted) {
                    console.error(e);
                }
            } finally {
                setIsPoolStatsLoading(false);
            }
        };

        getEverstakePoolStats();

        return () => {
            abortController.abort();
        };
    }, [symbol]);

    return {
        ethApy: poolStats.ethApy,
        nextRewardPayout: poolStats.nextRewardPayout,
        isPoolStatsLoading,
    };
};
