import { AssetSymbol } from '@suite/assets';
import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { createAssetId } from '@suite-common/asset-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Column, Paragraph } from '@trezor/components';

import { EarnRewardsAmount } from '../common/EarnRewardsAmount';

type EarnStakingPotentialRewardsProps = {
    symbol: NetworkSymbol;
    rewards: string;
    apy: number | null;
    isCardanoNetworkType: boolean;
    formattedAccountBalance: string;
};

export const EarnStakingPotentialRewards = ({
    symbol,
    rewards,
    apy,
    isCardanoNetworkType,
    formattedAccountBalance,
}: EarnStakingPotentialRewardsProps) => (
    <Column gap={4}>
        {apy && <EarnRewardsAmount symbol={symbol} rewards={rewards} apy={apy} intent="brand" />}

        {!isCardanoNetworkType && apy && (
            <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                <HiddenPlaceholder>
                    <Translation
                        id="TR_EARN_STAKING_DASHBOARD_IF_YOU_ADD"
                        values={{
                            amount: formattedAccountBalance,
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
