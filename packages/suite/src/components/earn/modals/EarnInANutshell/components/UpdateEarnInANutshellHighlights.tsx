import { ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { NetworkType } from '@suite-common/wallet-config';
import { isStakingNetworkType } from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';

import { EarnInANutshellHighlight, EarnInANutshellHighlights } from './EarnInANutshellHighlights';

interface UpdateEarnInANutshellHighlightsProps {
    networkType: NetworkType;
    displaySymbol: string;
    apy: string | ReactNode;
}

export const UpdateEarnInANutshellHighlights = ({
    networkType,
    displaySymbol,
    apy,
}: UpdateEarnInANutshellHighlightsProps) => {
    if (!isStakingNetworkType(networkType)) return null;

    const highlights: EarnInANutshellHighlight[] = [
        {
            icon: 'piggyBank',
            content: (
                <Translation
                    id="TR_EARN_APY_WITH_EVERSTAKE"
                    values={{ apy, networkDisplaySymbol: displaySymbol }}
                />
            ),
        },
        {
            icon: 'wallet',
            content: (
                <Translation
                    id="TR_EARN_YOUR_FUNDS_STAY_ACCESSIBLE"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            ),
        },
        {
            icon: 'handCoins',
            content: (
                <Translation
                    id="TR_EARN_STAKE_ALL_YOUR_FUNDS_IS_STAKED"
                    values={{ networkDisplaySymbol: displaySymbol }}
                />
            ),
        },
    ];

    switch (networkType) {
        case 'ethereum':
        case 'cardano':
        case 'solana':
            return <EarnInANutshellHighlights items={highlights} />;
        default:
            return exhaustive(networkType);
    }
};
