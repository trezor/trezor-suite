import { AssetValue } from '@suite/assets';
import { type TradingAssetOption } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { asAmountUnit, findToken } from '@suite-common/wallet-utils';
import { Column, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';

type GlobalReceiveAccountAssetAmountProps = {
    account: Account;
    asset: TradingAssetOption;
};

/** What the account holds of the asset being received, in fiat and in the asset itself. */
export const GlobalReceiveAccountAssetAmount = ({
    account,
    asset,
}: GlobalReceiveAccountAssetAmountProps) => {
    const token = asset.isNativeToken
        ? undefined
        : findToken(account.tokens, asset.contractAddress);
    const tokenAddress = asset.isNativeToken ? undefined : asset.contractAddress;
    // An eligible account need not hold the token yet, which is the point of receiving it.
    const amount = asset.isNativeToken ? account.formattedBalance : (token?.balance ?? '0');

    return (
        <Column alignItems="flex-end">
            <Text typographyStyle="body-md">
                <BaseCurrencyValue
                    amount={amount}
                    symbol={account.symbol}
                    tokenAddress={tokenAddress}
                />
            </Text>
            <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                <AssetValue
                    amount={asAmountUnit(new BigNumber(amount))}
                    networkSymbol={account.symbol}
                    contractAddress={tokenAddress}
                    isCompact
                />
            </Text>
        </Column>
    );
};
