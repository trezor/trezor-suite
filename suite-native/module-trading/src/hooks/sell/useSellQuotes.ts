import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { invariant } from '@suite-common/suite-utils';
import {
    type HandleSellRequestThunkProps,
    cryptoIdToNetwork,
    selectTradingSellIsLoading,
    selectValidTradingSellQuotes,
    sellThunks,
} from '@suite-common/trading';
import { type WalletSettingsRootState, selectIsAmountInSats } from '@suite-common/wallet-core';
import { useFormState, useWatch } from '@suite-native/forms';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { sellActions } from '@suite-native/trading-state';
import { type SellFormType } from '@suite-native/trading-types';
import { noop } from '@trezor/utils';

import { tradingSellFormToTradingSellFormProps } from '../../utils/sell/quotesUtils';
import { getQuotesRequestKey, useQuotesRequest } from '../general/useQuotesRequest';

const quoteDerivedCryptoErrorTypes = ['insufficient-balance', 'network-reserve'] as const;

const isQuoteDerivedCryptoError = (fieldName: string, type: unknown) =>
    fieldName === 'cryptoStringAmount' &&
    quoteDerivedCryptoErrorTypes.some(errorType => errorType === type);

export const useSellQuotes = ({ getValues, control }: SellFormType) => {
    const { dispatch } = useServices(injectDispatch);
    const [
        amountInCrypto,
        sendAsset,
        sendAccount,
        cryptoStringAmount,
        fiatStringAmount,
        fiatCurrency,
        country,
        countrySubdivision,
    ] = useWatch({
        control,
        name: [
            'amountInCrypto',
            'sendAsset',
            'sendAccount',
            'cryptoStringAmount',
            'fiatStringAmount',
            'fiatCurrency',
            'country',
            'countrySubdivision',
        ],
    });
    const { isValid, errors } = useFormState({ control });
    const shouldSendInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, getSymbolFromTradeableAsset(sendAsset)),
    );
    const quotes = useSelector(selectValidTradingSellQuotes);
    const isLoading = useSelector(selectTradingSellIsLoading);

    const errorEntries = Object.entries(errors);
    const isErrorCausedByQuote =
        !amountInCrypto &&
        errorEntries.every(([fieldName, { type }]) => isQuoteDerivedCryptoError(fieldName, type));
    const isFormValidForQuotes = isValid || isErrorCausedByQuote;

    const amount = amountInCrypto ? cryptoStringAmount : fiatStringAmount;
    const isFetchAllowed =
        isFormValidForQuotes && !!(sendAsset && fiatCurrency && amount && parseFloat(amount) > 0);

    const requestKey = getQuotesRequestKey(isFetchAllowed, {
        sendAsset: sendAsset?.cryptoId,
        amount,
        amountInCrypto,
        fiatCurrency,
        country: country?.value,
        countrySubdivision: countrySubdivision?.value,
        accountDescriptor: sendAccount?.descriptor,
    });

    const fetchQuotes = () => {
        const selectedAsset = getValues('sendAsset');
        invariant(selectedAsset, 'Asset is not defined');
        const network = cryptoIdToNetwork(selectedAsset.cryptoId);
        invariant(network, `Network not found for [${selectedAsset.cryptoId}]`);

        const payload: HandleSellRequestThunkProps = {
            network,
            shouldSendInSats,
            formValues: tradingSellFormToTradingSellFormProps(getValues),
            composeRequestCallback: noop,
        };

        return dispatch(sellThunks.handleRequestThunk(payload));
    };

    useQuotesRequest({
        requestKey,
        fetchQuotes,
        isLoading,
        hasQuotes: quotes.length > 0,
        clearQuotesAction: sellActions.clearQuotesAndQuotesRequest,
        clearStateAction: sellActions.clearState,
    });
};
