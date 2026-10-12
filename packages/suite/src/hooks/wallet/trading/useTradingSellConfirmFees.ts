import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import {
    type TradingComposedTransactionInfo,
    buildRecomposeInputsFromTrade,
    buildTradingComposeFormState,
    getTradingFormState,
    selectTradingComposedTransactionInfo,
    selectTradingSellActiveTrade,
    selectTradingSellFormValues,
    selectTradingSellProviders,
    selectTradingSellSelectedQuote,
    sellThunks,
    tradingActions,
} from '@suite-common/trading';
import {
    type FeesRootState,
    selectConvertedNetworkFeeInfo,
    useFetchFeesOnce,
    useRefetchFees,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { selectIsFeeRefetchBlockedByModal } from 'src/components/wallet/Fees/feeSelectors';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';

export const useTradingSellConfirmFees = (account: Account | undefined) => {
    const { dispatch } = useServices(injectDispatch);

    const selectedQuote = useSelector(selectTradingSellSelectedQuote);
    const trade = useSelector(selectTradingSellActiveTrade);
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, account?.symbol),
    );
    const device = useSelector((state: DeviceRootState) => selectSelectedDevice(state));
    const providers = useSelector(selectTradingSellProviders);
    const formValues = useSelector(selectTradingSellFormValues);
    const { composed, selectedFee } = useSelector(selectTradingComposedTransactionInfo);

    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(account?.symbol);
    const { getAssetDecimals } = useTradingAssetDecimals();

    const selectedTrade = trade?.data ?? selectedQuote;
    const decimals = getAssetDecimals({
        accountKey: account?.key,
        cryptoId: selectedTrade?.cryptoCurrency,
    });

    const isRefetchDisabled = useSelector(selectIsFeeRefetchBlockedByModal);

    useFetchFeesOnce({ networkSymbol: account?.symbol });
    useRefetchFees({ networkSymbol: account?.symbol, isDisabled: isRefetchDisabled });

    const partnerAddress = selectedTrade?.destinationAddress;
    const destinationAddress = partnerAddress ?? formValues?.outputs[0]?.address;

    const composeRequestRef = useRef<{ abort: () => void } | null>(null);

    const compose = useCallback(
        (composeAccount: Account) => {
            composeRequestRef.current?.abort();
            composeRequestRef.current = dispatch(
                sellThunks.composeTradeFeeLevelsThunk({
                    account: composeAccount,
                    decimals,
                    shouldSendInSats,
                }),
            );
        },
        [dispatch, decimals, shouldSendInSats],
    );

    useEffect(() => {
        if (!account) {
            return;
        }

        compose(account);

        return () => composeRequestRef.current?.abort();
    }, [account, compose, feeInfo, destinationAddress]);

    const composeFormState = useMemo(() => {
        if (
            !account ||
            !composed ||
            !selectedTrade ||
            destinationAddress === undefined ||
            !selectedTrade.cryptoStringAmount
        ) {
            return undefined;
        }

        return buildTradingComposeFormState({
            account,
            device,
            ...buildRecomposeInputsFromTrade({
                destinationAddress,
                cryptoStringAmount: selectedTrade.cryptoStringAmount,
                destinationPaymentExtraId: selectedTrade.destinationPaymentExtraId,
                shouldSendInSats,
                decimals,
            }),
            setMaxOutputId: undefined,
            composed,
            selectedFee,
            tradingFormState: getTradingFormState({
                activeSection: 'sell',
                providers,
                trade: selectedTrade,
                isSlip24Active: false,
                sendAccountKey: account.key,
            }),
        });
    }, [
        account,
        composed,
        decimals,
        destinationAddress,
        device,
        providers,
        selectedFee,
        selectedTrade,
        shouldSendInSats,
    ]);

    const applySelectedFee = (composedTransactionInfo: TradingComposedTransactionInfo) => {
        if (!account) {
            return;
        }

        dispatch(tradingActions.saveComposedTransactionInfo(composedTransactionInfo));
        compose(account);
    };

    return { feeInfo, composeFormState, applySelectedFee, assumeNewAccount: !partnerAddress };
};
