import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { FadeIn } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import {
    type TradingRootState,
    type TradingSellType,
    isFinalStatus,
    selectTradingCoinInfoByCryptoId,
    selectTradingProviderMetadata,
    selectTradingSellSelectedQuote,
    useTradingDetailData,
} from '@suite-common/trading';
import { selectSendPrecomposedTx } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen, ScreenHeader } from '@suite-native/navigation';
import {
    ProviderConfirmationStatusInfo,
    ProviderStatusDevButtons,
} from '@suite-native/trading-browser-auth';
import { Footer } from '@suite-native/trading-provider-utils';

import { LastErrorMessage } from '../components/general/Error/LastErrorMessage';
import { TradingDeviceConnectionGuard } from '../components/general/TradingDeviceConnectionGuard';
import { TradingPreviewErrorScreen } from '../components/general/TradingPreview/TradingPreviewErrorScreen';
import { SellCompletionConfirmButton } from '../components/sell/SellCompletion/SellCompletionConfirmButton';
import { SellCompletionView } from '../components/sell/SellCompletion/SellCompletionView';
import { useWatchTrade } from '../hooks/general/useWatchTrade';
import { useSellFlow } from '../hooks/sell/useSellFlow';
import { clearTradingStateThunk } from '../thunks';

const TradingSellCompletionScreenContent = () => {
    const dispatch = useDispatch();
    const composedOrderIdRef = useRef<string | undefined>(undefined);
    const { txnErrorString, doBankAccountVerificationCheck, composeTradingTransaction } =
        useSellFlow();
    const { trade } = useTradingDetailData<TradingSellType>('sell');
    const selectedQuote = useSelector(selectTradingSellSelectedQuote);
    const providerMetadata = useSelector(selectTradingProviderMetadata);
    const precomposedTransaction = useSelector(selectSendPrecomposedTx);

    const currentQuote = trade?.data ? trade.data : selectedQuote;
    const isFinalized = isFinalStatus('sell', currentQuote?.status);
    const shouldSendCrypto = currentQuote?.status === 'SEND_CRYPTO';

    const isTransactionReady = shouldSendCrypto && precomposedTransaction?.type === 'final';

    const [shouldShowHeader, setShouldShowHeader] = useState(false);

    const coinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, currentQuote?.cryptoCurrency),
    );

    useWatchTrade({
        accountKey: trade?.sendAccountKey,
        orderId: currentQuote?.orderId,
        isInProgress: true,
    });

    const runBankAccountVerificationCheck = useEffectEvent(() => {
        doBankAccountVerificationCheck();
    });
    useEffect(() => {
        runBankAccountVerificationCheck();
    }, []);

    useEffect(() => {
        if (
            currentQuote?.status === 'SEND_CRYPTO' &&
            currentQuote.orderId !== composedOrderIdRef.current
        ) {
            composedOrderIdRef.current = currentQuote.orderId;
            composeTradingTransaction();
        }
    }, [currentQuote?.orderId, currentQuote?.status, composeTradingTransaction]);

    useEffect(
        () => () => {
            dispatch(clearTradingStateThunk());
        },
        [dispatch],
    );

    if (!currentQuote || !providerMetadata) {
        return <TradingPreviewErrorScreen screenName="TradingSellCompletionScreen" />;
    }

    const { companyName } = providerMetadata;
    const cryptoSymbol = coinInfo?.symbol?.toUpperCase() ?? '';
    const errorString = txnErrorString ?? currentQuote.error;

    const handleConfirmationComplete = (status: 'success' | 'error') => {
        setShouldShowHeader(status === 'success');
    };

    const header =
        shouldSendCrypto && shouldShowHeader ? (
            <DynamicScreenHeader
                title={
                    <Translation
                        id="moduleTrading.tradingSellCompletionScreen.sendTitle"
                        values={{ cryptoSymbol, companyName }}
                    />
                }
                subtitle={
                    <Translation id="moduleTrading.tradingSellCompletionScreen.sendSubtitle" />
                }
                closeActionType="back"
                contentEnteringAnimation={FadeIn.delay(300)}
            />
        ) : (
            <ScreenHeader closeActionType="back" />
        );

    return (
        <Screen
            header={header}
            footer={
                !isFinalized && isTransactionReady && !errorString ? (
                    <SellCompletionConfirmButton quote={currentQuote} />
                ) : undefined
            }
        >
            <VStack spacing="sp16" flex={1}>
                <ProviderStatusDevButtons />
                <LastErrorMessage tradingType="sell" />
                <ProviderConfirmationStatusInfo
                    quoteStatus={currentQuote.status}
                    companyName={companyName}
                    onConfirmationComplete={handleConfirmationComplete}
                />
                <SellCompletionView
                    quote={currentQuote}
                    txnErrorString={errorString}
                    shouldShowFee={shouldSendCrypto}
                />
                <Footer />
            </VStack>
        </Screen>
    );
};

export const TradingSellCompletionScreen = () => (
    <TradingDeviceConnectionGuard>
        <TradingSellCompletionScreenContent />
    </TradingDeviceConnectionGuard>
);
