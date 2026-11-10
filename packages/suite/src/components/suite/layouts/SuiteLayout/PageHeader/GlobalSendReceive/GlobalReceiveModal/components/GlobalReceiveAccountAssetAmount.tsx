import { toTokenAddress } from '@suite-common/tokens';
import { type TradingAssetOption } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { findToken } from '@suite-common/wallet-utils';
import { Column, Text } from '@trezor/components';

import { BaseCurrencyValue, FormattedCryptoAmount } from '#src/components/suite';

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
    const tokenAddress = asset.isNativeToken ? undefined : toTokenAddress(asset.contractAddress);
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
                <FormattedCryptoAmount
                    value={amount}
                    symbol={token?.symbol ?? asset.displaySymbol}
                    contractAddress={tokenAddress}
                    tokenDecimals={token?.decimals}
                    isCompact
                />
            </Text>
        </Column>
    );
};
