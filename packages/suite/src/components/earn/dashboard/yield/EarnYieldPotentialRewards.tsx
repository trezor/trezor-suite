import { Translation } from '@suite/intl';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { Column, Paragraph } from '@trezor/components';

import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';

import { EarnRewardsAmount } from '../common/EarnRewardsAmount';

type EarnYieldPotentialRewardsProps = {
    hasMaximumDeposited: boolean;
    hasPotentialRewards: boolean;
    symbol: TokenSymbol;
    rewards: string;
    apy: number | null;
    formattedAdditionalSupplyAmount: string;
    displaySymbol: string;
};

export const EarnYieldPotentialRewards = ({
    hasMaximumDeposited,
    hasPotentialRewards,
    symbol,
    rewards,
    apy,
    formattedAdditionalSupplyAmount,
    displaySymbol,
}: EarnYieldPotentialRewardsProps) => {
    if (hasMaximumDeposited) {
        return (
            <Paragraph typographyStyle="body-md" intent="neutral" priority="secondary">
                <Translation id="TR_EARN_YIELD_MAXIMUM_DEPOSITED" />
            </Paragraph>
        );
    }

    if (!hasPotentialRewards) {
        return null;
    }

    return (
        <Column>
            <EarnRewardsAmount symbol={symbol} rewards={rewards} apy={apy} intent="brand" />

            <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                <HiddenPlaceholder>
                    <Translation
                        id="TR_EARN_STAKING_DASHBOARD_IF_YOU_ADD"
                        values={{ amount: formattedAdditionalSupplyAmount, displaySymbol }}
                    />
                </HiddenPlaceholder>
            </Paragraph>
        </Column>
    );
};
