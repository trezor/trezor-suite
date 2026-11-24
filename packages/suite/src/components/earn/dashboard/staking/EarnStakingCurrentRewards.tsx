import { AssetSymbol } from '@suite/assets';
import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { createAssetId } from '@suite-common/asset-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Column, Paragraph } from '@trezor/components';

import { EarnRewardsAmount } from '../common/EarnRewardsAmount';

type EarnStakingCurrentRewardsProps = {
    symbol: NetworkSymbol;
    rewards: string;
    apy: number | null;
    isStakingActive: boolean;
    formattedStakingBalance: string;
};

export const EarnStakingCurrentRewards = ({
    symbol,
    rewards,
    apy,
    isStakingActive,
    formattedStakingBalance,
}: EarnStakingCurrentRewardsProps) => (
    <Column alignItems="flex-start" gap={4}>
        <EarnRewardsAmount symbol={symbol} rewards={isStakingActive ? rewards : '0'} apy={apy} />

        {isStakingActive && (
            <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                <HiddenPlaceholder>
                    <Translation
                        id="TR_EARN_STAKING_DASHBOARD_STAKED"
                        values={{
                            amount: formattedStakingBalance,
                            displaySymbol: (
                                <AssetSymbol assetId={createAssetId({ networkSymbol: symbol })} />
                            ),
                        }}
                    />
                </HiddenPlaceholder>
            </Paragraph>
        )}
    </Column>
);
