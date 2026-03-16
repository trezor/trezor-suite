import { Translation } from '@suite/intl';
import {
    type NetworkSymbol,
    type StakingNetworkType,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';
import { exhaustive } from '@trezor/type-utils';

import {
    type EarnInANutshellHighlight,
    EarnInANutshellHighlights,
} from './EarnInANutshellHighlights';

interface YieldEarnInANutshellHighlightsProps {
    networkType: StakingNetworkType;
    networkSymbol: NetworkSymbol;
    unstakingPeriod?: number;
}

export const YieldEarnInANutshellHighlights = ({
    networkType,
    networkSymbol,
    unstakingPeriod,
}: YieldEarnInANutshellHighlightsProps) => {
    const networkDisplaySymbol = getNetworkDisplaySymbol(networkSymbol);

    const highlights: EarnInANutshellHighlight[] = (() => {
        switch (networkType) {
            case 'ethereum':
                return [
                    {
                        icon: 'lockSimple',
                        content: (
                            <Translation
                                id="TR_EARN_STAKED_AMOUNT_LOCKED"
                                values={{ networkDisplaySymbol }}
                            />
                        ),
                    },
                    {
                        icon: 'handCoins',
                        content: (
                            <Translation
                                id="TR_EARN_STAKE_REWARDS"
                                values={{ networkDisplaySymbol }}
                            />
                        ),
                    },
                    {
                        icon: 'arrowBendDoubleUpLeft',
                        content: (
                            <Translation
                                id="TR_EARN_ETH_UNSTAKING_TAKES"
                                values={{ count: unstakingPeriod }}
                            />
                        ),
                    },
                ];
            case 'solana':
                return [
                    {
                        icon: 'lockSimple',
                        content: (
                            <Translation
                                id="TR_EARN_STAKED_AMOUNT_LOCKED"
                                values={{ networkDisplaySymbol }}
                            />
                        ),
                    },
                    {
                        icon: 'handCoins',
                        content: (
                            <Translation
                                id="TR_EARN_STAKE_REWARDS"
                                values={{ networkDisplaySymbol }}
                            />
                        ),
                    },
                    {
                        icon: 'arrowBendDoubleUpLeft',
                        content: (
                            <Translation
                                id="TR_EARN_SOL_UNSTAKING_TAKES"
                                values={{ count: unstakingPeriod }}
                            />
                        ),
                    },
                ];
            case 'cardano':
                return [
                    {
                        icon: 'wallet',
                        content: (
                            <Translation
                                id="TR_EARN_YOUR_FUNDS_STAY_ACCESSIBLE"
                                values={{ networkDisplaySymbol }}
                            />
                        ),
                    },
                    {
                        icon: 'handCoins',
                        content: (
                            <Translation
                                id="TR_EARN_STAKE_ALL_YOUR_FUNDS_IS_STAKED"
                                values={{ networkDisplaySymbol }}
                            />
                        ),
                    },
                    {
                        icon: 'scroll',
                        content: (
                            <Translation
                                id="TR_EARN_RETURNABLE_DEPOSIT_IS_REQUIRED"
                                values={{ networkDisplaySymbol }}
                            />
                        ),
                    },
                ];
            default:
                return exhaustive(networkType);
        }
    })();

    return <EarnInANutshellHighlights items={highlights} />;
};
