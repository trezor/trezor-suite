import { useSelector } from 'react-redux';

import {
    type StakingRootState,
    formatStakingAmount,
    selectStakingPositionEntriesByAccount,
} from '@suite-common/earn-staking';
import { getStakingPositionAmount } from '@suite-common/earn-staking-common';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { BannerFull } from '@suite-native/atoms';
import { CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

type SolExternalStakingBannerProps = {
    accountKey: AccountKey;
    networkSymbol: NetworkSymbol;
};

export const SolExternalStakingBanner = ({
    accountKey,
    networkSymbol,
}: SolExternalStakingBannerProps) => {
    // Stake with other validators is the account's position that counts in no total.
    const externalPositionEntry = useSelector(
        (state: StakingRootState) =>
            selectStakingPositionEntriesByAccount(state, accountKey).find(
                ({ descriptor }) => !descriptor.isCountedInAccountTotals,
            ) ?? null,
    );

    if (externalPositionEntry === null) return null;

    const displaySymbol = getNetworkDisplaySymbol(networkSymbol);

    const totalStakedInUnits = formatStakingAmount({
        amount: getStakingPositionAmount(externalPositionEntry.position),
        networkSymbol,
    });

    return (
        <BannerFull
            testID="@staking/outside-staking-card"
            intent="neutral"
            iconName="puzzlePiece"
            title={<Translation id="earn.stakingManagementScreen.outsideStakingBanner.title" />}
            description={
                <Translation
                    id="earn.stakingManagementScreen.outsideStakingBanner.description"
                    values={{
                        amount: totalStakedInUnits,
                        symbol: displaySymbol,
                        fiat: (
                            <CryptoToFiatAmountFormatter
                                value={totalStakedInUnits}
                                symbol={networkSymbol}
                                variant="body-sm"
                                color="contentSecondary"
                                // Keep the fiat equivalent readable alongside the external stake amount in this notice.
                                discreetMode="disabled"
                                isBalance
                            />
                        ),
                    }}
                />
            }
        />
    );
};
