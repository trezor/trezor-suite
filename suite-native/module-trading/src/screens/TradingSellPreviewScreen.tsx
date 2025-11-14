import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    TradingSellType,
    selectTradingSellSelectedQuote,
    useTradingDetailData,
} from '@suite-common/trading';
import { Screen } from '@suite-native/navigation';

import {
    SellPreviewContinueButton,
    SellPreviewScreenHeader,
    SellPreviewView,
} from '../components/sell/SellPreview';
import { useWatchTrade } from '../hooks/general/useWatchTrade';
import { useSellFlow } from '../hooks/sell/useSellFlow';
import { clearTradingStateThunk } from '../thunks';

export const TradingSellPreviewScreen = () => {
    const dispatch = useDispatch();
    const { txnErrorString, doBankAccountVerificationCheck, fetchFeesAndCompose } = useSellFlow();
    const { trade } = useTradingDetailData<TradingSellType>('sell');
    const selectedQuote = useSelector(selectTradingSellSelectedQuote);

    const currentQuote = trade?.data ? trade.data : selectedQuote;
    const currentStatus = useRef(currentQuote?.status);

    useWatchTrade({
        accountKey: trade?.sendAccountKey,
        orderId: currentQuote?.orderId,
        isInProgress: false,
    });

    useEffect(() => {
        doBankAccountVerificationCheck();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // only fetch fees and compose if the form step has changed to SEND_TRANSACTION
        // dependencies are not stable, so we use useRef to store the previous form step
        if (
            currentStatus.current !== currentQuote?.status &&
            currentQuote?.status === 'SEND_CRYPTO'
        ) {
            currentStatus.current = currentQuote?.status;
            fetchFeesAndCompose();
        }
    }, [fetchFeesAndCompose, currentQuote]);

    // clear trading state on unmount
    useEffect(
        () => () => {
            dispatch(clearTradingStateThunk());
        },
        [dispatch],
    );

    const onSignTransactionNavigation = useCallback(() => {
        // TODO: Add analytics if needed
    }, []);

    const errorString = txnErrorString ?? currentQuote?.error;

    return (
        <Screen header={<SellPreviewScreenHeader />}>
            <SellPreviewView quote={currentQuote} txnErrorString={errorString} />
            <SellPreviewContinueButton
                quote={currentQuote}
                isDisabled={!!errorString}
                onSignTransactionNavigation={onSignTransactionNavigation}
            />
        </Screen>
    );
};
