import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { Column, Paragraph } from '@trezor/components';

import { EarnRewardsAmount } from '../common/EarnRewardsAmount';

type EarnYieldYearlyRewardsProps = {
    symbol: TokenSymbol;
    rewards: string;
    apy: number | null;
    hasDisplayableSuppliedAmount: boolean;
    formattedSuppliedAmount: string;
    displaySymbol: string;
};

export const EarnYieldYearlyRewards = ({
    symbol,
    rewards,
    apy,
    hasDisplayableSuppliedAmount,
    formattedSuppliedAmount,
    displaySymbol,
}: EarnYieldYearlyRewardsProps) => (
    <Column>
        <EarnRewardsAmount symbol={symbol} rewards={rewards} apy={apy} />

        {hasDisplayableSuppliedAmount && (
            <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                <HiddenPlaceholder>
                    <Translation
                        id="TR_EARN_YIELD_DASHBOARD_SUPPLIED"
                        values={{ amount: formattedSuppliedAmount, displaySymbol }}
                    />
                </HiddenPlaceholder>
            </Paragraph>
        )}
    </Column>
);
