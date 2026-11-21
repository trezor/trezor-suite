import { AssetValue } from '@suite/assets';
import { type AssetId } from '@suite-common/tokens';
import { type Account } from '@suite-common/wallet-types';
import { asAmountUnit, findToken } from '@suite-common/wallet-utils';
import { Column, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';

type GlobalReceiveAccountAssetAmountProps = {
    account: Account;
    assetId: AssetId;
};

/** What the account holds of the asset being received, in fiat and in the assetId itself. */
export const GlobalReceiveAccountAssetAmount = ({
    account,
    assetId,
}: GlobalReceiveAccountAssetAmountProps) => {
    const { contractAddress } = assetId;
    const token = contractAddress ? findToken(account.tokens, contractAddress) : undefined;
    // An eligible account need not hold the token yet, which is the point of receiving it.
    const amount = contractAddress ? (token?.balance ?? '0') : account.formattedBalance;

    return (
        <Column alignItems="flex-end">
            <Text typographyStyle="body-md">
                <BaseCurrencyValue
                    amount={amount}
                    symbol={account.symbol}
                    tokenAddress={contractAddress}
                />
            </Text>
            <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                <AssetValue
                    amount={asAmountUnit(new BigNumber(amount))}
                    networkSymbol={account.symbol}
                    contractAddress={contractAddress}
                    isCompact
                />
            </Text>
        </Column>
    );
};
