import { memo, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import {
    type TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingExchangeFormProps,
    type TradingSellFormProps,
} from '@suite-common/trading';
import { Row } from '@trezor/components';

import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingFiatValues } from 'src/hooks/wallet/trading/form/common/useTradingFiatValues';
import { useTradingFindAccountOrToken } from 'src/hooks/wallet/trading/form/common/useTradingFindAccountOrToken';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';

export interface AssetPickerInputBalanceProps {
    name: typeof TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT;
    showOnlyAmount?: boolean;
}

export const AssetPickerInputBalance = memo(function AssetPickerInputBalance({
    name,
    showOnlyAmount,
}: AssetPickerInputBalanceProps) {
    const { watch, getValues } = useFormContext<TradingSellFormProps | TradingExchangeFormProps>();
    const value = watch(name);
    const findAccountOrToken = useTradingFindAccountOrToken();

    const accountOrToken = useMemo(() => {
        if (!value) return undefined;

        return findAccountOrToken.current({
            accountKey: value.accountKey,
            cryptoId: value.id,
        });
    }, [findAccountOrToken, value]);

    const amount = useMemo(() => {
        if (!accountOrToken) return undefined;

        return accountOrToken.token
            ? accountOrToken.token.balance
            : accountOrToken.account.formattedBalance;
    }, [accountOrToken]);

    const { getAssetDecimals } = useTradingAssetDecimals();
    const assetDecimals = useMemo(() => {
        if (!value) return undefined;

        return getAssetDecimals({ accountKey: value.accountKey, cryptoId: value.id });
    }, [getAssetDecimals, value]);

    const fiatValues = useTradingFiatValues({
        amount,
        cryptoId: value?.id,
        fiatCurrency: getValues('outputs')?.[0]?.currency?.value || undefined,
        isErc4626: !!accountOrToken?.token?.protocols?.erc4626,
    });

    if (!fiatValues || !value) {
        return null;
    }

    return (
        <Row justifyContent="flex-start">
            <TradingBalance
                balance={fiatValues.accountBalance}
                symbol={fiatValues.symbol}
                tokenAddress={fiatValues.tokenAddress}
                displaySymbol={value?.displaySymbol}
                decimals={assetDecimals}
                showOnlyAmount={showOnlyAmount}
            />
        </Row>
    );
});
