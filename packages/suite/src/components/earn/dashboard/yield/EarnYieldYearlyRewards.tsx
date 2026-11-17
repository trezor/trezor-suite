import { AssetSymbol } from '@suite/assets';
import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import type { YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { Column, Paragraph } from '@trezor/components';

import { EarnYieldCompactAmount } from './EarnYieldCompactAmount';
import { EarnRewardsAmount } from '../common/EarnRewardsAmount';

type EarnYieldYearlyRewardsProps = {
    token: YieldFlowDisplayToken;
    rewards: string;
    apy: number | null;
    hasDisplayableDepositedAmount: boolean;
    depositedAmount: string;
};

export const EarnYieldYearlyRewards = ({
    token,
    rewards,
    apy,
    hasDisplayableDepositedAmount,
    depositedAmount,
}: EarnYieldYearlyRewardsProps) => (
    <Column gap={4}>
        <EarnRewardsAmount
            data-testid="@earn/dashboard/yearly-rewards/amount"
            symbol={token.networkSymbol}
            contractAddress={token.contractAddress}
            rewards={rewards}
            apy={apy}
        />

        {hasDisplayableDepositedAmount && (
            <Paragraph
                typographyStyle="body-sm"
                intent="neutral"
                priority="secondary"
                data-testid="@earn/dashboard/deposited-amount"
            >
                <HiddenPlaceholder>
                    <Translation
                        id="TR_EARN_YIELD_DASHBOARD_DEPOSITED"
                        values={{
                            amount: (
                                <EarnYieldCompactAmount amount={depositedAmount} token={token} />
                            ),
                            displaySymbol: (
                                <AssetSymbol
                                    networkSymbol={token.networkSymbol}
                                    contractAddress={token.contractAddress}
                                />
                            ),
                        }}
                    />
                </HiddenPlaceholder>
            </Paragraph>
        )}
    </Column>
);
