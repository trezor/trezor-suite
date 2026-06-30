import { Translation } from '@suite/intl';
import { type NetworkType } from '@suite-common/wallet-config';
import { isStakingNetworkType } from '@suite-common/wallet-utils';
import {
    ArrowBendDoubleUpLeftIcon,
    HandCoinsIcon,
    LockSimpleIcon,
    ScrollIcon,
    WalletIcon,
} from '@trezor/icons';
import { exhaustive } from '@trezor/type-utils';

import {
    type EarnInANutshellHighlight,
    EarnInANutshellHighlights,
} from './EarnInANutshellHighlights';

interface StakingEarnInANutshellHighlightsProps {
    networkType: NetworkType;
    displaySymbol: string;
    unstakingPeriod?: number;
}

export const StakingEarnInANutshellHighlights = ({
    networkType,
    displaySymbol,
    unstakingPeriod,
}: StakingEarnInANutshellHighlightsProps) => {
    if (!isStakingNetworkType(networkType)) return null;

    const highlights: EarnInANutshellHighlight[] = (() => {
        switch (networkType) {
            case 'ethereum':
                return [
                    {
                        icon: LockSimpleIcon,
                        content: (
                            <Translation
                                id="TR_EARN_STAKED_AMOUNT_LOCKED"
                                values={{ networkDisplaySymbol: displaySymbol }}
                            />
                        ),
                    },
                    {
                        icon: HandCoinsIcon,
                        content: (
                            <Translation
                                id="TR_EARN_STAKE_REWARDS"
                                values={{ networkDisplaySymbol: displaySymbol }}
                            />
                        ),
                    },
                    {
                        icon: ArrowBendDoubleUpLeftIcon,
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
                        icon: LockSimpleIcon,
                        content: (
                            <Translation
                                id="TR_EARN_STAKED_AMOUNT_LOCKED"
                                values={{ networkDisplaySymbol: displaySymbol }}
                            />
                        ),
                    },
                    {
                        icon: HandCoinsIcon,
                        content: (
                            <Translation
                                id="TR_EARN_STAKE_REWARDS"
                                values={{ networkDisplaySymbol: displaySymbol }}
                            />
                        ),
                    },
                    {
                        icon: ArrowBendDoubleUpLeftIcon,
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
                        icon: WalletIcon,
                        content: (
                            <Translation
                                id="TR_EARN_YOUR_FUNDS_STAY_ACCESSIBLE"
                                values={{ networkDisplaySymbol: displaySymbol }}
                            />
                        ),
                    },
                    {
                        icon: HandCoinsIcon,
                        content: (
                            <Translation
                                id="TR_EARN_STAKE_ALL_YOUR_FUNDS_IS_STAKED"
                                values={{ networkDisplaySymbol: displaySymbol }}
                            />
                        ),
                    },
                    {
                        icon: ScrollIcon,
                        content: (
                            <Translation
                                id="TR_EARN_RETURNABLE_DEPOSIT_IS_REQUIRED"
                                values={{ networkDisplaySymbol: displaySymbol }}
                            />
                        ),
                    },
                ];
            case 'tron':
                return [];
            default:
                return exhaustive(networkType);
        }
    })();

    return <EarnInANutshellHighlights items={highlights} />;
};
