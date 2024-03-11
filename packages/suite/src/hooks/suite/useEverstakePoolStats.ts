import { useEffect, useMemo, useState } from 'react';
import BigNumber from 'bignumber.js';
import { BACKUP_ETH_APY, STAKE_SYMBOLS } from 'src/constants/suite/ethStaking';
import { selectEnabledNetworks } from 'src/reducers/wallet/settingsReducer';
import { useSelector } from './useSelector';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

export const useEverstakePoolStats = () => {
    const isDebug = useSelector(selectIsDebugModeActive);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const areEthNetworksEnabled = useMemo(
        () => enabledNetworks.some(symbol => STAKE_SYMBOLS.includes(symbol)),
        [enabledNetworks],
    );
    const [poolStats, setPoolStats] = useState<{ ethApy: string; nextRewardPayout: number | null }>(
        {
            ethApy: BACKUP_ETH_APY,
            nextRewardPayout: null,
        },
    );
    const [isPoolStatsLoading, setIsPoolStatsLoading] = useState(false);

    useEffect(() => {
        if (!areEthNetworksEnabled || !isDebug) return;

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
    }, [areEthNetworksEnabled, isDebug]);

    return {
        ethApy: poolStats.ethApy,
        nextRewardPayout: poolStats.nextRewardPayout,
        isPoolStatsLoading,
    };
};
