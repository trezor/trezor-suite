import { useEffect } from 'react';
import { type UseFormReturn, useWatch } from 'react-hook-form';

import {
    TRADING_FORM_CRYPTO_TOKEN,
    TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_OUTPUT_AMOUNT_FIELDS,
    TRADING_FORM_OUTPUT_CURRENCY,
    TRADING_FORM_OUTPUT_FIAT,
    TRADING_FORM_OUTPUT_MAX,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingAssetSellOption,
    type TradingFiatRatesReturn,
    mapFiatCurrencyCodeToBaseCurrencyCode,
} from '@suite-common/trading';
import {
    type Account,
    type PrecomposedLevels,
    type PrecomposedLevelsCardano,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { type FeeLevel } from '@trezor/connect';

import { type TradingSellExchangeFormProps } from 'src/types/trading/tradingForm';
import { type AmountLimitProps } from 'src/utils/suite/validation';
import { resolveAddressAndToken } from 'src/utils/wallet/trading/tradingUtils';

interface UseTradingCryptoAssetChangeProps<T extends TradingSellExchangeFormProps> {
    account: Account | undefined;
    accounts: Account[];
    methods: UseFormReturn<T>;
    tradingFiatValues: TradingFiatRatesReturn | null;
    setAmountLimits: (limits?: AmountLimitProps) => void;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    setComposedLevels: (levels: PrecomposedLevels | PrecomposedLevelsCardano | undefined) => void;
    setAccountOnChange: (account: Account) => void;
}

/**
 * Send-asset-change cluster shared by the sell and exchange form-input hooks:
 * the onCryptoCurrencyChange handler that resets amount fields and refreshes fiat
 * rates, plus the effect that syncs the active send account to the selected asset.
 */
export const useTradingCryptoAssetChange = <T extends TradingSellExchangeFormProps>({
    account,
    accounts,
    methods,
    tradingFiatValues,
    setAmountLimits,
    changeFeeLevel,
    setComposedLevels,
    setAccountOnChange,
}: UseTradingCryptoAssetChangeProps<T>) => {
    // TODO: drop this cast via capability callbacks instead of methods: UseFormReturn<T>
    const { getValues, setValue, clearErrors, control } =
        methods as unknown as UseFormReturn<TradingSellExchangeFormProps>;

    const sendCryptoSelect = useWatch({ control, name: TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT });

    const onCryptoCurrencyChange = async (selected: TradingAssetSellOption) => {
        const cryptoSelectedCurrent = getValues(TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT);
        const isSameCryptoSelected =
            cryptoSelectedCurrent?.accountKey === selected.accountKey &&
            cryptoSelectedCurrent.id === selected.id;
        const selectedAccount = accounts.find(item => item.key === selected.accountKey);

        if (!selectedAccount || isSameCryptoSelected) return;

        const { token } = resolveAddressAndToken(selectedAccount, selected.contractAddress);

        setValue(TRADING_FORM_CRYPTO_TOKEN, token);
        setValue(TRADING_FORM_OUTPUT_MAX, undefined);
        setValue(TRADING_FORM_OUTPUT_FIAT, '');
        setValue(TRADING_FORM_OUTPUT_AMOUNT, '');
        setValue(TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT, selected);
        clearErrors(TRADING_FORM_OUTPUT_AMOUNT_FIELDS);
        setAmountLimits(undefined);
        setComposedLevels(undefined);

        setAccountOnChange(selectedAccount);
        changeFeeLevel('normal'); // reset fee level

        const mappedBaseCurrencyCode = mapFiatCurrencyCodeToBaseCurrencyCode(
            getValues(TRADING_FORM_OUTPUT_CURRENCY)?.value,
        );

        if (mappedBaseCurrencyCode) {
            await tradingFiatValues?.fiatRatesUpdater(
                mappedBaseCurrencyCode,
                selected.contractAddress as TokenAddress,
            );
        }
    };

    useEffect(() => {
        const selectedAccountKey = sendCryptoSelect?.accountKey;

        if (!selectedAccountKey || selectedAccountKey === account?.key) {
            return;
        }

        const selectedAccount = accounts.find(item => item.key === selectedAccountKey);

        if (!selectedAccount) {
            return;
        }

        setAccountOnChange(selectedAccount);
    }, [account?.key, accounts, sendCryptoSelect?.accountKey, setAccountOnChange]);

    return {
        onCryptoCurrencyChange,
    };
};
