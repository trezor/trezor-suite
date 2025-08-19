import { ScrollView } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';

import { invariant } from '@suite-common/suite-utils';
import { selectTradingExchangeSelectedQuote } from '@suite-common/trading';
import { Button, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { ExchangeTradePreviewCard } from '../components/exchange/ExchangeTradePreviewCard';
import { useExchangeFlow } from '../hooks/exchange/useExchangeFlow';
import { useChangeStringsExtractor } from '../hooks/history/useChangeStringsExtractor';
import {
    selectExchangeSelectedReceiveAccount,
    selectExchangeSelectedSendAccount,
} from '../selectors/exchangeSelectors';

export const TradingExchangePreviewScreen = () => {
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const fromAccount = useSelector(selectExchangeSelectedSendAccount);
    const toAccount = useSelector(selectExchangeSelectedReceiveAccount);

    invariant(quote, 'quote must be defined');
    invariant(fromAccount, 'fromAccount must be defined');
    invariant(toAccount, 'toAccount must be defined');

    const { fromStringValue, toStringValue } = useChangeStringsExtractor(quote);
    const { confirmTrade } = useExchangeFlow();

    const handleConfirmTrade = () => {
        const { account } = toAccount;

        if (!account.descriptor) {
            console.warn('receiveAddress is not defined', quote);

            return;
        }

        confirmTrade({
            sendAccount: fromAccount,
            receiveAddress: account.descriptor,
            trade: quote,
            approvalFlow: false,
        });
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
                </VStack>
            </ScrollView>

            <Button onPress={handleConfirmTrade}>
                <Translation id="generic.buttons.continue" />
            </Button>
        </Screen>
    );
};
