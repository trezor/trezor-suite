import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkConfigs } from '@suite-common/networks';
import { injectDispatch } from '@suite-common/redux-utils';
import { invariant } from '@suite-common/suite-utils';
import {
    type HandleBuyRequestThunkProps,
    type TradingRootState,
    buyThunks,
    cryptoIdToNetwork,
    selectTradingBuyIsLoading,
    selectTradingCoinInfoByCryptoId,
    selectTradingPlatformByCryptoId,
} from '@suite-common/trading';
import { type WalletSettingsRootState, selectIsAmountInSats } from '@suite-common/wallet-core';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { useWatch } from '@suite-native/forms';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { buyActions, selectValidTradingBuyQuotesNative } from '@suite-native/trading-state';
import { type BuyFormType } from '@suite-native/trading-types';

import { tradingBuyFormToTradingBuyFormProps } from '../../utils/buy/quotesUtils';
import { getReceiveAccountAddressText } from '../../utils/general/receiveAccountUtils';
import { getQuotesRequestKey, useQuotesRequest } from '../general/useQuotesRequest';

export const useBuyQuotes = (form: BuyFormType) => {
    const { analytics, dispatch } = useServices(injectNativeAnalytics, injectDispatch);
    const [
        asset,
        fiatCurrency,
        fiatValue,
        cryptoValue,
        amountInCrypto,
        country,
        countrySubdivision,
        receiveAccount,
    ] = useWatch({
        control: form.control,
        name: [
            'asset',
            'fiatCurrency',
            'fiatValue',
            'cryptoValue',
            'amountInCrypto',
            'country',
            'countrySubdivision',
            'receiveAccount',
        ],
    });
    const shouldSendInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, getSymbolFromTradeableAsset(asset)),
    );
    const coinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, asset?.cryptoId),
    );
    const platformInfo = useSelector((state: TradingRootState) =>
        selectTradingPlatformByCryptoId(state, asset?.cryptoId),
    );
    const quotes = useSelector(selectValidTradingBuyQuotesNative);
    const isLoading = useSelector(selectTradingBuyIsLoading);
    const networkConfigs = useSelector(selectNetworkConfigs);

    const amount = amountInCrypto ? cryptoValue : fiatValue;
    const isFetchAllowed = !!(asset && fiatCurrency && amount && parseFloat(amount) > 0);

    const requestKey = getQuotesRequestKey(isFetchAllowed, {
        cryptoId: asset?.cryptoId,
        fiatCurrency,
        amount,
        amountInCrypto,
        country: country?.value,
        countrySubdivision: countrySubdivision?.value,
        receiveAccountAddress: getReceiveAccountAddressText(receiveAccount),
    });

    const fetchQuotes = () => {
        if (!coinInfo) {
            return;
        }

        const selectedAsset = form.getValues('asset');
        invariant(selectedAsset, 'Asset is not defined');
        const network = cryptoIdToNetwork(selectedAsset.cryptoId);
        invariant(network, `Network not found for [${selectedAsset.cryptoId}]`);

        const payload: HandleBuyRequestThunkProps = {
            network,
            formValues: tradingBuyFormToTradingBuyFormProps(
                form,
                coinInfo,
                platformInfo,
                networkConfigs,
            ),
            shouldSendInSats,
        };

        return dispatch(buyThunks.handleRequestThunk(payload));
    };

    const reportQuotesReceived = () =>
        analytics.report({
            type: events.tradingQuoteReceivedEvent.name,
            payload: {
                type: 'buy',
            },
        });

    useQuotesRequest({
        requestKey,
        fetchQuotes,
        onQuotesReceived: reportQuotesReceived,
        isLoading,
        hasQuotes: quotes.length > 0,
        clearQuotesAction: buyActions.clearQuotesAndQuotesRequest,
        clearStateAction: buyActions.clearState,
    });
};
