import { useSelector } from 'react-redux';

import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectHasSolExternalStakingAccounts,
    selectSolExternalStakingAccountsTotalStaked,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { BannerFull } from '@suite-native/atoms';
import { CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

type SolExternalStakingBannerProps = {
    accountKey: AccountKey;
    networkSymbol: NetworkSymbol;
};

export const SolExternalStakingBanner = ({
    accountKey,
    networkSymbol,
}: SolExternalStakingBannerProps) => {
    const hasExternalStakingAccounts = useSelector((state: AccountsRootState) =>
        selectHasSolExternalStakingAccounts(state, accountKey),
    );
    const externalStakingTotalStaked = useSelector((state: AccountsRootState) =>
        selectSolExternalStakingAccountsTotalStaked(state, accountKey),
    );

    if (!hasExternalStakingAccounts) return null;

    const displaySymbol = getNetworkDisplaySymbol(networkSymbol);
    const totalStakedInUnits = subunitsToUnits({
        value: asAmountSubunit(new BigNumber(externalStakingTotalStaked)),
        symbol: networkSymbol,
    }).toString();

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
                                isDiscreetText={false}
                                isBalance
                            />
                        ),
                    }}
                />
            }
        />
    );
};
