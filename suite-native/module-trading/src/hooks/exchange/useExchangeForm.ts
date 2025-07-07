import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { ExchangeTrade } from 'invity-api';

import { selectTradingExchangeProviders } from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { WalletSettingsRootState, selectIsAmountInSats } from '@suite-common/wallet-core';
import { convertAmountUnitsToSubunits } from '@suite-common/wallet-utils';
import { useForm } from '@suite-native/forms';

import { selectGroupedExchangeQuotes } from '../../selectors/exchangeSelectors';
import { ExchangeFormType, ExchangeFormValues } from '../../types/exchange';
import { exchangeFormValidationSchema } from '../../utils/exchange/exchangeFormValidationSchema';
import { getSymbolFromTradeableAsset } from '../../utils/general/tradeableAssetUtils';

const useExchangeQuotesChangeEffect = ({ setValue }: ExchangeFormType) => {
    const providers = useSelector(selectTradingExchangeProviders);
    const quoteGroups = useSelector(selectGroupedExchangeQuotes);

    useEffect(() => {
        const setQuote = (quote: ExchangeTrade | undefined) => setValue('quote', quote);

        if (quoteGroups.fixed.length > 0) {
            setQuote(quoteGroups.fixed[0]);

            return;
        }

        if (quoteGroups.float.length > 0) {
            setQuote(quoteGroups.float[0]);

            return;
        }

        if (quoteGroups.dex.length > 0) {
            setQuote(quoteGroups.dex[0]);

            return;
        }

        setQuote(undefined);
    }, [providers, quoteGroups, setValue]);
};

const useExchangeQuoteChangeEffect = ({ watch, setValue }: ExchangeFormType) => {
    const [selectedQuote, receiveAsset] = watch(['quote', 'receiveAsset']);
    const symbol = getSymbolFromTradeableAsset(receiveAsset);

    const isAmountInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, symbol),
    );

    useEffect(() => {
        const amount = selectedQuote?.receiveStringAmount;
        if (!amount) {
            setValue('receiveCryptoAmount', undefined);

            return;
        }

        const value =
            isAmountInSats && amount && symbol
                ? convertAmountUnitsToSubunits(amount, getNetwork(symbol).decimals)
                : amount;
        setValue('receiveCryptoAmount', value);
    }, [selectedQuote, isAmountInSats, symbol, setValue]);
};

export const useExchangeForm = () => {
    const form = useForm<ExchangeFormValues>({
        validation: exchangeFormValidationSchema,
    });

    useExchangeQuotesChangeEffect(form);
    useExchangeQuoteChangeEffect(form);

    return form;
};
