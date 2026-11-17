import { AssetSymbol } from '@suite/assets';
import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import type { YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { Column, Paragraph } from '@trezor/components';

import { EarnYieldCompactAmount } from './EarnYieldCompactAmount';
import { EarnRewardsAmount } from '../common/EarnRewardsAmount';

type EarnYieldPotentialRewardsProps = {
    hasMaximumDeposited: boolean;
    hasPotentialRewards: boolean;
    token: YieldFlowDisplayToken;
    rewards: string;
    apy: number | null;
    additionalDepositAmount: string;
};

export const EarnYieldPotentialRewards = ({
    hasMaximumDeposited,
    hasPotentialRewards,
    token,
    rewards,
    apy,
    additionalDepositAmount,
}: EarnYieldPotentialRewardsProps) => {
    if (hasMaximumDeposited) {
        return (
            <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id="TR_EARN_YIELD_MAXIMUM_DEPOSITED" />
            </Paragraph>
        );
    }

    if (!hasPotentialRewards) {
        return null;
    }

    return (
        <Column gap={4}>
            <EarnRewardsAmount
                data-testid="@earn/dashboard/potential-rewards/amount"
                symbol={token.networkSymbol}
                contractAddress={token.contractAddress}
                rewards={rewards}
                apy={apy}
                intent="brand"
            />

            <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                <HiddenPlaceholder>
                    <Translation
                        id="TR_EARN_STAKING_DASHBOARD_IF_YOU_ADD"
                        values={{
                            amount: (
                                <EarnYieldCompactAmount
                                    amount={additionalDepositAmount}
                                    token={token}
                                />
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
        </Column>
    );
};
