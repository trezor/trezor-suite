import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';

import { invariant } from '@suite-common/suite-utils';
import { selectTradingExchangeSelectedQuote } from '@suite-common/trading';
import { Button, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';
import { useSubscribeForSolanaBlockUpdates } from '@suite-native/transaction-management';

import { ExchangeTradePreviewCard } from '../components/exchange/ExchangeTradePreviewCard';
import { FeePickerCard } from '../components/fees/FeePickerCard';
import { useExchangeFlow } from '../hooks/exchange/useExchangeFlow';
import { useChangeStringsExtractor } from '../hooks/history/useChangeStringsExtractor';
import { exchangeActions } from '../reducers';
import {
    selectExchangeSelectedReceiveAccount,
    selectExchangeSelectedSendAccount,
} from '../selectors/exchangeSelectors';
import { getReceiveAccountAddressText } from '../utils/general/receiveAccountUtils';

type FlowStep = 'confirm' | 'signTxn' | 'sendTxn' | 'finished';

// TODO: this is very WIP just to be able to test the flow
// it wont be implemented in this component this way in the end
const flowStepToButtonText: Record<FlowStep, string> = {
    confirm: 'Continue',
    signTxn: 'Sign and Send Transaction',
    sendTxn: 'Send txn',
    finished: 'Txn was sent',
};

export const TradingExchangePreviewScreen = () => {
    const { showToast } = useToast();
    const dispatch = useDispatch();
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const fromAccount = useSelector(selectExchangeSelectedSendAccount);
    const toAccount = useSelector(selectExchangeSelectedReceiveAccount);

    invariant(quote, 'quote must be defined');
    invariant(fromAccount, 'fromAccount must be defined');
    invariant(toAccount, 'toAccount must be defined');

    const { fromStringValue, toStringValue } = useChangeStringsExtractor(quote);

    useEffect(
        () => () => {
            dispatch(exchangeActions.clearState());
        },
        [dispatch],
    );

    useSubscribeForSolanaBlockUpdates(fromAccount);

    const {
        confirmTrade,
        fetchFeesAndCompose,
        signAndSendTransaction,
        isConsentRequested,
        resolveConsent,
    } = useExchangeFlow();

    const [flowStep, setFlowStep] = useState<FlowStep>('confirm');

    const handleConfirmTrade = async () => {
        const addressText = getReceiveAccountAddressText(toAccount);

        if (!addressText) {
            console.warn('receiveAddress is not defined', quote);

            return;
        }

        const success = await confirmTrade({
            sendAccount: fromAccount,
            receiveAddress: addressText,
            trade: quote,
            approvalFlow: false,
        });

        if (success) {
            await fetchFeesAndCompose();
        }
    };

    const handleSignTransaction = async () => {
        setFlowStep('sendTxn');

        const result = await signAndSendTransaction();

        showToast({
            icon: result ? 'check' : 'warningCircle',
            variant: result ? 'success' : 'error',
            message: undefined,
        });
    };

    useEffect(() => {
        if (isConsentRequested) {
            setFlowStep('sendTxn');
        }
    }, [isConsentRequested]);

    const handleTapContinue = async () => {
        if (flowStep === 'confirm') {
            handleConfirmTrade();
            await fetchFeesAndCompose();
            setFlowStep('signTxn');
        } else if (flowStep === 'signTxn') {
            handleSignTransaction();
        } else if (flowStep === 'sendTxn') {
            setFlowStep('finished');
            resolveConsent(true);
        } else {
            console.warn('Unknown flow step', flowStep);
        }
    };

    return (
        <Screen
            header={
                <ScreenHeader
                    title={<Translation id="moduleTrading.tradingExchangePreviewScreen.title" />}
                    closeActionType="close"
                />
            }
        >
            <ScrollView>
                <VStack spacing="sp20" paddingVertical="sp20">
                    <ExchangeTradePreviewCard
                        account={fromAccount}
                        cryptoId={quote.send}
                        amount={
                            <Text variant="hint" color="textAlertRed">
                                -{fromStringValue}
                            </Text>
                        }
                        title={
                            <Translation id="moduleTrading.tradingExchangePreviewScreen.fromAccount" />
                        }
                    />
                    <ExchangeTradePreviewCard
                        account={toAccount.account}
                        cryptoId={quote.receive}
                        amount={
                            <Text variant="hint" color="textSecondaryHighlight">
                                +{toStringValue}
                            </Text>
                        }
                        title={
                            <Translation id="moduleTrading.tradingExchangePreviewScreen.toAccount" />
                        }
                    />
                    {(flowStep === 'signTxn' || flowStep === 'sendTxn') && (
                        <FeePickerCard
                            trade={quote}
                            symbol={fromAccount.symbol}
                            accountKey={fromAccount.key}
                        />
                    )}
                </VStack>
            </ScrollView>

            <Button onPress={handleTapContinue} isDisabled={flowStep === 'finished'}>
                {flowStepToButtonText[flowStep]}
            </Button>
        </Screen>
    );
};
