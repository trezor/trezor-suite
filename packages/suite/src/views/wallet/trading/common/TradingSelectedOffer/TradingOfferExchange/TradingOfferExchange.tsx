import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import {
    selectTradingExchangeActiveTrade,
    selectTradingExchangeFormStep,
    selectTradingExchangeInfo,
    selectTradingExchangeIsLoading,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { Button, Card, Column, H2 } from '@trezor/components';
import { useAsyncClickHandler } from '@trezor/react-utils';

import { useSelector } from 'src/hooks/suite';
import { useTradingExchangeTradeActions } from 'src/hooks/wallet/trading/useTradingExchangeTradeActions';
import { type TradingExchangeProvidersInfoProps } from 'src/types/trading/trading';
import { tradingGetAmountLabels } from 'src/utils/wallet/trading/tradingUtils';

import { TradingOfferExchangeDetails } from './TradingOfferExchangeDetails';
import { TradingFiatDeviationWarning } from '../../TradingFiatDeviationWarning';
import { TradingInfoItem } from '../TradingInfo/TradingInfoItem';

export const TradingOfferExchange = () => {
    const { handleClick, disabled } = useAsyncClickHandler();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { device } = useDevice();
    const formStep = useSelector(selectTradingExchangeFormStep);
    const exchangeInfo = useSelector(selectTradingExchangeInfo);
    const receiveAccountKey = useSelector(selectTradingExchangeReceiveAccountKey);
    const receiveAccount = useSelector(
        state => selectAccountByKey(state, receiveAccountKey) ?? undefined,
    );

    const {
        account: sendAccount,
        sendTransaction,
        signDataAndConfirm,
    } = useTradingExchangeTradeActions();
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const trade = useSelector(selectTradingExchangeActiveTrade);
    const isLoading = useSelector(selectTradingExchangeIsLoading);

    const isConfirmDisabled = isLoading || !selectedQuote || !sendAccount || !device?.connected;

    const selectedTrade = trade?.data ?? selectedQuote;

    if (!selectedTrade) {
        return null;
    }

    const providers = exchangeInfo?.providerInfos;

    const amountLabels = tradingGetAmountLabels({ type: 'exchange', amountInCrypto: false });

    const { exchange, signData } = selectedTrade;

    const isSignData = formStep === 'SIGN_DATA' && !!signData;

    const confirmAndSend = async () => {
        const result = await sendTransaction();

        analytics.report({
            type: events.tradeExchangeEvent.name,
            payload: {
                action: result ? 'continue' : 'cancel',
                step: 'confirm-and-send',
                slippage: selectedTrade.swapSlippage,
            },
        });
    };

    const onConfirmAndSendClick = async () => {
        if (isSignData) {
            await signDataAndConfirm();
        } else {
            await confirmAndSend();
        }
    };

    return (
        <Column width="100%" alignItems="center">
            <Card width="100%" maxWidth="440px" data-testid="@trading/selected-offer">
                <Column gap={20}>
                    <H2 typographyStyle="headline-sm">
                        <Translation id="TR_SELL_CONFIRM_SEND_STEP" />
                    </H2>
                    <TradingInfoItem
                        key={amountLabels.sendLabel}
                        account={sendAccount}
                        label={amountLabels.sendLabel}
                        currency={selectedTrade.send}
                        amount={selectedTrade.sendStringAmount ?? ''}
                    />

                    <TradingInfoItem
                        key={amountLabels.receiveLabel}
                        account={receiveAccount}
                        label={amountLabels.receiveLabel}
                        currency={selectedTrade.receive}
                        amount={selectedTrade.receiveStringAmount ?? ''}
                        receiveAddress={selectedTrade.receiveAddress}
                        isReceive
                    />
                    <TradingFiatDeviationWarning selectedQuote={selectedTrade} />
                    {sendAccount && (
                        <TradingOfferExchangeDetails
                            account={sendAccount}
                            exchangeQuote={selectedTrade}
                            providers={providers as TradingExchangeProvidersInfoProps}
                            exchange={exchange}
                        />
                    )}

                    <Button
                        data-testid="@trading/offer/confirm-on-trezor-and-send"
                        isLoading={isLoading || disabled}
                        isDisabled={isConfirmDisabled || disabled}
                        onClick={() => handleClick(() => onConfirmAndSendClick())}
                        size="large"
                        width="100%"
                    >
                        <Translation id="TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND" />
                    </Button>
                </Column>
            </Card>
        </Column>
    );
};
