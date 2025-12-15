import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    TradingSellType,
    isFinalStatus,
    selectTradingSellSelectedQuote,
    useTradingDetailData,
} from '@suite-common/trading';
import { AsyncButton, InlineAlertBox, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';
import { WaitingCard } from '@suite-native/trading-atoms';

import { Footer } from '../components/general/Footer';
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
    const {
        txnErrorString,
        doBankAccountVerificationCheck,
        fetchFeesAndCompose,
        retryDoSellTrade,
    } = useSellFlow();
    const { trade } = useTradingDetailData<TradingSellType>('sell');
    const selectedQuote = useSelector(selectTradingSellSelectedQuote);
    const [shouldFetchFees, setShouldFetchFees] = useState(false);

    const currentQuote = trade?.data ? trade.data : selectedQuote;
    const isFinalized = isFinalStatus('sell', currentQuote?.status);
    const isSubmitted = currentQuote?.status === 'SUBMITTED';

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
        // TODO: Add analytics if needed
    }, []);

    const errorString = txnErrorString ?? currentQuote?.error;

    return (
        <Screen header={<SellPreviewScreenHeader />}>
            <VStack spacing="sp16">
                <WaitingCard
                    title={
                        <Translation id="moduleTrading.tradingSellPreviewScreen.providerStatus.confirming" />
                    }
                    subtitle={
                        <Translation id="moduleTrading.tradingSellPreviewScreen.providerStatus.upTo30Seconds" />
                    }
                />
                <InlineAlertBox
                    title={
                        <Translation id="moduleTrading.tradingSellPreviewScreen.providerStatus.startOver" />
                    }
                    iconName="info"
                    variant="info"
                />
            </VStack>
            <SellPreviewView quote={currentQuote} txnErrorString={errorString} />
            {!isFinalized && (
                <SellPreviewContinueButton
                    quote={currentQuote}
                    isDisabled={!!errorString}
                    onSignTransactionNavigation={onSignTransactionNavigation}
                />
            )}
            {isSubmitted && (
                <AsyncButton onPress={retryDoSellTrade}>
                    <Translation id="generic.buttons.continue" />
                </AsyncButton>
            )}
            <Footer type="sell" />
        </Screen>
    );
};
