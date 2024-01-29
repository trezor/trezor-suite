import { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import { BACKUP_ETH_APY } from 'src/constants/suite/ethStaking';

export const useEverstakePoolStats = () => {
    const [poolStats, setPoolStats] = useState<{ ethApy: string; nextRewardPayout: number | null }>(
        {
            ethApy: BACKUP_ETH_APY,
            nextRewardPayout: null,
        },
    );
    const [isPoolStatsLoading, setIsPoolStatsLoading] = useState(false);

    useEffect(() => {
        const abortController = new AbortController();

        const getEverstakePoolStats = async () => {
            try {
                setIsPoolStatsLoading(true);

                const response = await fetch(
                    // Stage URL. Works only with VPN.
                    'https://eth-api-b2c-stage.everstake.one/api/v1/stats',
                    // TODO: Prod URL. Switch to it before deploying to production.
                    // 'https://eth-api-b2c.everstake.one/api/v1/validators/queue',
                    {
                        method: 'GET',
                        signal: abortController.signal,
                    },
                );

                const stats = await response.json();
                setPoolStats({
                    ethApy: new BigNumber(stats.apr)
                        .times(100)
                        .toPrecision(3, BigNumber.ROUND_DOWN),
                    nextRewardPayout: Math.round(stats.next_reward_payout_in / 60 / 60 / 24),
                });
            } catch (e) {
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
    }, []);

    return {
        ethApy: poolStats.ethApy,
        nextRewardPayout: poolStats.nextRewardPayout,
        isPoolStatsLoading,
    };
};
