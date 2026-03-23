import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    type TradingSellType,
    isFinalStatus,
    selectTradingSellSelectedQuote,
    useTradingDetailData,
} from '@suite-common/trading';
import { Screen } from '@suite-native/navigation';
import { useSellAnalyticReportCallback } from '@suite-native/trading-analytics';
import {
    ProviderConfirmationStatusInfo,
    ProviderStatusDevButtons,
} from '@suite-native/trading-browser-auth';

import { LastErrorMessage } from '../components/general/Error/LastErrorMessage';
import { Footer } from '../components/general/Footer';
import { TradingDeviceConnectionGuard } from '../components/general/TradingDeviceConnectionGuard';
import {
    SellPreviewContinueButton,
    SellPreviewScreenHeader,
    SellPreviewView,
} from '../components/sell/SellPreview';
import { useWatchTrade } from '../hooks/general/useWatchTrade';
import { useSellFlow } from '../hooks/sell/useSellFlow';
import { clearTradingStateThunk } from '../thunks';

const TradingSellPreviewScreenContent = () => {
    const dispatch = useDispatch();
    const { txnErrorString, doBankAccountVerificationCheck, fetchFeesAndCompose } = useSellFlow();
    const { trade } = useTradingDetailData<TradingSellType>('sell');
    const selectedQuote = useSelector(selectTradingSellSelectedQuote);
    const [shouldFetchFees, setShouldFetchFees] = useState(false);

    const currentQuote = trade?.data ? trade.data : selectedQuote;
    const isFinalized = isFinalStatus('sell', currentQuote?.status);

    const reportToAnalytics = useSellAnalyticReportCallback();
    useEffect(() => {
        reportToAnalytics('transaction-preview', 'visit');
    }, [reportToAnalytics]);

    useWatchTrade({
        accountKey: trade?.sendAccountKey,
        orderId: currentQuote?.orderId,
        isInProgress: true,
    });

    useEffect(() => {
        doBankAccountVerificationCheck();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch fees and compose when status is SEND_CRYPTO
    useEffect(() => {
        if (currentQuote?.status === 'SEND_CRYPTO') {
            setShouldFetchFees(true);
        }
    }, [currentQuote?.status, currentQuote?.orderId]);

    // unfortunately fetchFeesAndCompose is too unstable to be used directly in above useEffect
    useEffect(() => {
        if (shouldFetchFees) {
            setShouldFetchFees(false);
            fetchFeesAndCompose();
        }
    }, [shouldFetchFees, fetchFeesAndCompose]);

    // clear trading state on unmount
    useEffect(
        () => () => {
            dispatch(clearTradingStateThunk());
        },
        [dispatch],
    );

    const onSignTransactionNavigation = useCallback(() => {
        reportToAnalytics('transaction-preview', 'continue');
    }, [reportToAnalytics]);

    const errorString = txnErrorString ?? currentQuote?.error;

    return (
        <Screen header={<SellPreviewScreenHeader />}>
            <ProviderStatusDevButtons />
            <LastErrorMessage tradingType="sell" />
            <ProviderConfirmationStatusInfo />
            <SellPreviewView quote={currentQuote} txnErrorString={errorString} />
            {!isFinalized && (
                <SellPreviewContinueButton
                    quote={currentQuote}
                    isDisabled={!!errorString}
                    onSignTransactionNavigation={onSignTransactionNavigation}
                />
            )}
            <Footer />
        </Screen>
    );
};

export const TradingSellPreviewScreen = () => (
    <TradingDeviceConnectionGuard>
        <TradingSellPreviewScreenContent />
    </TradingDeviceConnectionGuard>
);
