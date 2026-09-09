import { useCallback, useEffect } from 'react';
import { type UseFormReturn, useWatch } from 'react-hook-form';

import { useDispatch } from '@suite-common/redux-utils';
import {
    TRADING_EXCHANGE_FORM_DEX,
    TRADING_FORM_OUTPUT_ADDRESS,
    TRADING_FORM_PROVIDER_SELECT,
    type TradingAssetSellOption,
    type TradingExchangeFormProps,
    type TradingExchangeFormType,
    getDexEstimationData,
    selectTradingExchangeQuoteToEstimate,
} from '@suite-common/trading';
import { isAccountBasedNetwork } from '@suite-common/wallet-config';
import { ETHEREUM_ADJUST_GAS_LIMIT, updateFeeInfoThunk } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getEvmTransactionTextSignature } from '@suite-common/wallet-utils';
import { useCurrentRef } from '@trezor/react-utils';

import { useSelector } from 'src/hooks/suite';
import { type TradingSellExchangeFormProps } from 'src/types/trading/tradingForm';
import { type SendContextValues } from 'src/types/wallet/sendForm';

type UseExchangeDexQuoteProps = {
    account: Account | undefined;
    methods: UseFormReturn<TradingExchangeFormProps>;
    isFormLoading: boolean;
    isLoadingQuote: boolean;
    exchangeType: TradingExchangeFormType;
    sendCryptoSelect: TradingAssetSellOption | undefined;
    composeRequest: SendContextValues<TradingSellExchangeFormProps>['composeTransaction'];
};

/**
 * DEX-quote machinery for the exchange form: syncs the sender address, derives the
 * transaction data / receive address / gas-limit bump from the active DEX quote, and
 * re-fetches fees + recomposes whenever that transaction data changes.
 */
export const useExchangeDexQuote = ({
    account,
    methods,
    isFormLoading,
    isLoadingQuote,
    exchangeType,
    sendCryptoSelect,
    composeRequest,
}: UseExchangeDexQuoteProps) => {
    const dispatch = useDispatch();
    const { setValue, control } = methods;

    const [transactionData, outputAddress, ethereumAdjustGasLimit] = useWatch({
        control,
        name: ['transactionData', TRADING_FORM_OUTPUT_ADDRESS, 'ethereumAdjustGasLimit'],
    });

    const provider = useWatch({ control, name: TRADING_FORM_PROVIDER_SELECT });
    const quote = useSelector(reduxState =>
        selectTradingExchangeQuoteToEstimate(reduxState, {
            provider,
            exchangeType,
            sendCryptoId: sendCryptoSelect?.id,
        }),
    );

    const accountRef = useCurrentRef(account);
    const composeRequestRef = useCurrentRef(composeRequest);
    const fetchFeesAndCompose = useCallback(async () => {
        if (!account) {
            return;
        }

        const accountKey = account.key;

        await dispatch(updateFeeInfoThunk({ networkSymbol: account.symbol }));

        if (accountRef.current?.key !== accountKey) {
            return;
        }

        composeRequestRef.current();
    }, [dispatch, account, accountRef, composeRequestRef]);

    useEffect(() => {
        if (!account) {
            return;
        }

        const fromAddress = isAccountBasedNetwork(account.symbol) ? account.descriptor : undefined;

        setValue('fromAddress', fromAddress);
    }, [account, setValue]);

    // set transactionData from DEX quote for correct fees fetching
    useEffect(() => {
        if (!sendCryptoSelect?.id) return;
        if (isFormLoading || isLoadingQuote) return;

        if (exchangeType !== TRADING_EXCHANGE_FORM_DEX) {
            setValue('transactionData', '');
            setValue(TRADING_FORM_OUTPUT_ADDRESS, '');

            return;
        }

        if (!quote?.dexTx) {
            setValue('transactionData', '');
            setValue(TRADING_FORM_OUTPUT_ADDRESS, '');

            return;
        }

        const { dexTx } = quote;

        setValue('transactionData', getDexEstimationData(quote) ?? '');
        setValue(TRADING_FORM_OUTPUT_ADDRESS, dexTx.to);
        setValue('ethereumAdjustGasLimit', ETHEREUM_ADJUST_GAS_LIMIT);
    }, [quote, exchangeType, sendCryptoSelect, isFormLoading, isLoadingQuote, setValue]);

    const fetchFeesAndComposeRef = useCurrentRef(fetchFeesAndCompose);
    // Fetch fees when the transaction to estimate changes shape.
    const transactionShape = getEvmTransactionTextSignature(transactionData);
    useEffect(() => {
        fetchFeesAndComposeRef.current();
    }, [transactionShape, outputAddress, ethereumAdjustGasLimit, fetchFeesAndComposeRef]);

    return { fetchFeesAndCompose };
};
