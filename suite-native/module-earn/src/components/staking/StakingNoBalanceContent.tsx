import { useSelector } from 'react-redux';

import { createAssetId } from '@suite-common/assets';
import {
    type StakingRootState,
    formatStakingAmount,
    selectStakeableStakingProductDescriptorBySymbol,
    useNetworkStakingRate,
} from '@suite-common/earn-staking';
import { useFormatters } from '@suite-common/formatters';
import { type NetworksRootState, selectNativeTokenName } from '@suite-common/networks';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { AssetSymbol } from '@suite-native/assets';
import { Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { useEarnNoBalanceActions } from '../../hooks/earn/useEarnNoBalanceActions';
import { EarnAmountCard } from '../earn/EarnAmountCard';
import { EarnNoBalanceCard } from '../earn/EarnNoBalanceCard';
import { EarnNoBalanceFooter } from '../earn/EarnNoBalanceFooter';

type StakingNoBalanceContentProps = {
    accountKey: AccountKey;
};

export const StakingNoBalanceContent = ({ accountKey }: StakingNoBalanceContentProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const networkSymbol = account?.symbol ?? null;
    const nativeTokenName = useSelector((state: NetworksRootState) =>
        networkSymbol === null ? undefined : selectNativeTokenName(state, networkSymbol),
    );
    const stakingLimits = useSelector((state: StakingRootState) =>
        networkSymbol === null
            ? null
            : (selectStakeableStakingProductDescriptorBySymbol(state, networkSymbol)?.limits ??
              null),
    );

    const { rate } = useNetworkStakingRate({ networkSymbol, accountKey });

    const { handleBuyPress, handleReceivePress } = useEarnNoBalanceActions({ accountKey });
    const { CryptoAmountFormatter } = useFormatters();

    if (!account) {
        return null;
    }

    const nativeAssetId = createAssetId({ networkSymbol: account.symbol });

    return (
        <Screen
            header={
                <ScreenHeader
                    title={
                        <Translation
                            id="earn.earnFormScreen.title"
                            values={{ assetName: nativeTokenName }}
                        />
                    }
                />
            }
            footer={
                <EarnNoBalanceFooter
                    networkSymbol={account.symbol}
                    onBuyPress={handleBuyPress}
                    onReceivePress={handleReceivePress}
                />
            }
        >
            <EarnAmountCard accountKey={accountKey} />
            <Box marginTop="sp16">
                <EarnNoBalanceCard
                    apy={rate}
                    title={
                        <Translation
                            id="earn.noBalance.staking.title"
                            values={{
                                displaySymbol: (
                                    <AssetSymbol assetId={nativeAssetId} variant="headline-sm" />
                                ),
                            }}
                        />
                    }
                    subtitle={
                        stakingLimits ? (
                            <Translation
                                id="earn.noBalance.staking.subtitle"
                                values={{
                                    minAmount: CryptoAmountFormatter.format(
                                        formatStakingAmount({
                                            amount: stakingLimits.minStakeAmount,
                                            networkSymbol: account.symbol,
                                        }),
                                        {
                                            symbol: account.symbol,
                                            isBalance: true,
                                            withSymbol: false,
                                        },
                                    ),
                                    displaySymbol: (
                                        <AssetSymbol
                                            assetId={nativeAssetId}
                                            color="contentSecondary"
                                        />
                                    ),
                                }}
                            />
                        ) : (
                            <Translation
                                id="earn.noBalance.staking.subtitleWithoutMinimum"
                                values={{
                                    displaySymbol: (
                                        <AssetSymbol
                                            assetId={nativeAssetId}
                                            color="contentSecondary"
                                        />
                                    ),
                                }}
                            />
                        )
                    }
                />
            </Box>
        </Screen>
    );
};
