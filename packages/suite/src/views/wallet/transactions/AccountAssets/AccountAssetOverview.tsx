import { Translation } from '@suite/intl';
import { selectAccountAssets } from '@suite-common/assets';
import { type AccountKey } from '@suite-common/wallet-types';
import { Column, H3, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useAccountHeaderContext } from 'src/support/suite/AccountHeaderProvider';
import { HomeTotalBalance } from 'src/views/home/HomeBalance/HomeTotalBalance';

import { AccountAssetTable } from './AccountAssetTable';

type AccountAssetOverviewProps = {
    accountKey: AccountKey;
};

/** The account as Home shows the wallet: what it is worth in total, and each asset it holds. */
export const AccountAssetOverview = ({ accountKey }: AccountAssetOverviewProps) => {
    const assets = useSelector(state => selectAccountAssets(state, accountKey));
    const fiatValues = assets.flatMap(({ fiatValue }) => fiatValue ?? []);
    // No total while nothing can be priced: zero would say the account is empty.
    const fiatValue =
        fiatValues.length === 0
            ? undefined
            : fiatValues.reduce((total, value) => total.plus(value), new BigNumber(0));
    // Testnets are never priced, nor is anything before the rates load, so the coin it holds,
    // its stake included, stands in for the total.
    const coinAssets = assets.filter(({ kind }) => kind !== 'token');
    const [coinAsset] = coinAssets;
    const { balanceSectionRef } = useAccountHeaderContext();

    return (
        <Column gap={40} alignItems="stretch" data-testid="@wallet/account-assets">
            <Column ref={balanceSectionRef} alignItems="flex-start">
                <HomeTotalBalance
                    fiatValue={fiatValue}
                    data-testid="@wallet/account-assets/fiat-amount"
                />
                {fiatValue === undefined && coinAsset !== undefined && (
                    <Text typographyStyle="headline-lg">
                        <FormattedCryptoAmount
                            value={coinAssets
                                .reduce((total, { amount }) => total.plus(amount), new BigNumber(0))
                                .toFixed()}
                            symbol={coinAsset.symbol}
                            data-testid="@wallet/account-assets/crypto-amount"
                        />
                    </Text>
                )}
            </Column>
            <Column gap={16} alignItems="stretch">
                <H3>
                    <Translation id="TR_ACCOUNT_ASSETS" />
                </H3>
                <AccountAssetTable accountKey={accountKey} />
            </Column>
        </Column>
    );
};
