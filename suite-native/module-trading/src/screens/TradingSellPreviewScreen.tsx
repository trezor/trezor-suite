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
    const hasFetchedAndComposedFees = useRef(false);
    const lastOrderId = useRef<string | undefined>(undefined);

    useWatchTrade({
        accountKey: trade?.sendAccountKey,
        orderId: currentQuote?.orderId,
        isInProgress: true,
    });

    useEffect(() => {
        doBankAccountVerificationCheck();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset the flag when quote changes (different orderId) or status changes away from SEND_CRYPTO
    useEffect(() => {
        const orderIdChanged = lastOrderId.current !== currentQuote?.orderId;
        const statusNotSendCrypto = currentQuote?.status !== 'SEND_CRYPTO';

        if (orderIdChanged || statusNotSendCrypto) {
            hasFetchedAndComposedFees.current = false;
        }

        lastOrderId.current = currentQuote?.orderId;
    }, [currentQuote?.orderId, currentQuote?.status]);

    // Fetch fees and compose when status is SEND_CRYPTO and we haven't fetched yet
    useEffect(() => {
        if (currentQuote?.status === 'SEND_CRYPTO' && !hasFetchedAndComposedFees.current) {
            hasFetchedAndComposedFees.current = true;
            fetchFeesAndCompose();
        }
    }, [fetchFeesAndCompose, currentQuote?.status, currentQuote?.orderId]);

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
