import { selectWalletAssetTokenDecimals, selectWalletAssetTokenSymbol } from '@suite-common/assets';
import { type AssetAccount, selectAccountByKey } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { CardList, Column, Text } from '@trezor/components';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { HOME_ASSET_LINE_GAP } from 'src/views/home/HomeAssetsTable/homeAssetTableLayout';

import { AssetDetailAccountIdentity } from './AssetDetailAccountIdentity';

type AssetDetailAccountListItemProps = {
    assetAccount: AssetAccount;
    onClick: (account: Account) => void;
};

export const AssetDetailAccountListItem = ({
    assetAccount,
    onClick,
}: AssetDetailAccountListItemProps) => {
    const { accountKey, assetKey, symbol, contractAddress, cryptoBalance } = assetAccount;
    const account = useSelector(state => selectAccountByKey(state, accountKey));
    const tokenSymbol = useSelector(state => selectWalletAssetTokenSymbol(state, assetKey));
    const tokenDecimals = useSelector(state => selectWalletAssetTokenDecimals(state, assetKey));

    if (account === null) {
        return null;
    }

    return (
        <CardList.Item onClick={() => onClick(account)}>
            <AssetDetailAccountIdentity
                account={account}
                data-testid={`@asset-detail/accounts/${account.accountType}/${account.index}`}
            />
            <Column alignItems="flex-end" gap={HOME_ASSET_LINE_GAP}>
                <BaseCurrencyValue
                    amount={cryptoBalance}
                    symbol={symbol}
                    tokenAddress={contractAddress}
                />
                <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                    <FormattedCryptoAmount
                        value={cryptoBalance}
                        symbol={tokenSymbol ?? symbol}
                        contractAddress={contractAddress}
                        tokenDecimals={tokenDecimals}
                        isCompact
                    />
                </Text>
            </Column>
        </CardList.Item>
    );
};
