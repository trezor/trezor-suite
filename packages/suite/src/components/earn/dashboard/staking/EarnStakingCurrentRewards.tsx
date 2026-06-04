import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Column, Paragraph } from '@trezor/components';

import { EarnRewardsAmount } from '../common/EarnRewardsAmount';

type EarnStakingCurrentRewardsProps = {
    symbol: NetworkSymbol;
    rewards: string;
    apy: number | null;
    isStakingActive: boolean;
    formattedStakingBalance: string;
    displaySymbol: string;
};

export const EarnStakingCurrentRewards = ({
    symbol,
    rewards,
    apy,
    isStakingActive,
    formattedStakingBalance,
    displaySymbol,
}: EarnStakingCurrentRewardsProps) => (
    <Column alignItems="flex-start">
        <EarnRewardsAmount symbol={symbol} rewards={isStakingActive ? rewards : '0'} apy={apy} />

        {isStakingActive && (
            <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                <HiddenPlaceholder>
                    <Translation
                        id="TR_EARN_STAKING_DASHBOARD_STAKED"
                        values={{ amount: formattedStakingBalance, displaySymbol }}
                    />
                </HiddenPlaceholder>
            </Paragraph>
        )}
    </Column>
);
