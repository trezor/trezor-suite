import { Translation } from '@suite/intl';
import {
    type NetworkSymbol,
    type StakingNetworkType,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';
import { exhaustive } from '@trezor/type-utils';

import { formatApyValue } from 'src/views/wallet/staking/utils/formatStakeValues';

import {
    type EarnInANutshellHighlight,
    EarnInANutshellHighlights,
} from './EarnInANutshellHighlights';

interface UpdateEarnInANutshellHighlightsProps {
    networkType: StakingNetworkType;
    networkSymbol: NetworkSymbol;
    apy: number | null;
}

export const UpdateEarnInANutshellHighlights = ({
    networkType,
    networkSymbol,
    apy,
}: UpdateEarnInANutshellHighlightsProps) => {
    const networkDisplaySymbol = getNetworkDisplaySymbol(networkSymbol);

    const highlights: EarnInANutshellHighlight[] = [
        {
            icon: 'piggyBank',
            content: (
                <Translation
                    id="TR_EARN_APY_WITH_EVERSTAKE"
                    values={{ apy: formatApyValue(apy), networkDisplaySymbol }}
                />
            ),
        },
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
