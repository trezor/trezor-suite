import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { Column, Paragraph } from '@trezor/components';

import { EarnRewardsAmount } from '../common/EarnRewardsAmount';

type EarnYieldYearlyRewardsProps = {
    symbol: TokenSymbol;
    rewards: string;
    apy: number | null;
    hasDisplayableDepositedAmount: boolean;
    formattedDepositedAmount: string;
    displaySymbol: string;
};

export const EarnYieldYearlyRewards = ({
    symbol,
    rewards,
    apy,
    hasDisplayableDepositedAmount,
    formattedDepositedAmount,
    displaySymbol,
}: EarnYieldYearlyRewardsProps) => (
    <Column>
        <EarnRewardsAmount symbol={symbol} rewards={rewards} apy={apy} />

        {hasDisplayableDepositedAmount && (
            <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                <HiddenPlaceholder>
                    <Translation
                        id="TR_EARN_YIELD_DASHBOARD_DEPOSITED"
                        values={{ amount: formattedDepositedAmount, displaySymbol }}
                    />
                </HiddenPlaceholder>
            </Paragraph>
        )}
    </Column>
);
