import { type CryptoId } from 'invity-api';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import {
    type TradingExchangeType,
    selectTradingExchangeFormStep,
    selectTradingExchangeReceiveAccountKey,
} from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { Button, Column, H2 } from '@trezor/components';
import { useAsyncClickHandler } from '@trezor/react-utils';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useAnalytics } from 'src/support/useAnalytics';
import { type TradingExchangeProvidersInfoProps } from 'src/types/trading/trading';
import { type TradingOfferExchangeProps } from 'src/types/trading/tradingForm';
import { tradingGetAmountLabels } from 'src/utils/wallet/trading/tradingUtils';

import { TradingOfferExchangeDetails } from './TradingOfferExchangeDetails';
import { TradingFiatDeviationWarning } from '../../TradingFiatDeviationWarning';
import { TradingInfoItem } from '../TradingInfo/TradingInfoItem';

export const TradingOfferExchange = ({
    account: sendAccount,
    selectedQuote,
    providers,
    type,
    quoteAmounts,
}: TradingOfferExchangeProps) => {
    const { handleClick, disabled } = useAsyncClickHandler();
    const analytics = useAnalytics();
    const formStep = useSelector(selectTradingExchangeFormStep);
    const receiveAccountKey = useSelector(selectTradingExchangeReceiveAccountKey);
    const receiveAccount = useSelector(
        state => selectAccountByKey(state, receiveAccountKey) ?? undefined,
    );

    const {
        device,
        form: {
            state: { isFormLoading },
        },
        sendTransaction,
        signDataAndConfirm,
    } = useTradingFormContext<TradingExchangeType>();

    const amountInCrypto = quoteAmounts?.amountInCrypto ?? true;
    const amountLabels = tradingGetAmountLabels({ type, amountInCrypto });

    const { exchange, signData } = selectedQuote;

    const isSignData = formStep === 'SIGN_DATA' && !!signData;

    const confirmAndSend = async () => {
        const result = await sendTransaction();

        analytics.report({
            type: events.tradeExchangeEvent.name,
            payload: {
                action: result ? 'continue' : 'cancel',
                step: 'confirm-and-send',
                slippage: selectedQuote.swapSlippage,
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
        <Column gap={spacings.lg}>
            <H2 typographyStyle="headline-sm">
                <Translation id="TR_SELL_CONFIRM_SEND_STEP" />
            </H2>
            <TradingInfoItem
                key={amountLabels.sendLabel}
                account={sendAccount}
                type={type}
                label={amountLabels.sendLabel}
                currency={quoteAmounts?.sendCurrency as CryptoId}
                amount={quoteAmounts?.sendAmount}
            />

            <TradingInfoItem
                key={amountLabels.receiveLabel}
                account={receiveAccount}
                type={type}
                label={amountLabels.receiveLabel}
                currency={quoteAmounts?.receiveCurrency}
                amount={quoteAmounts?.receiveAmount}
                receiveAddress={selectedQuote.receiveAddress}
                isReceive
            />
            <TradingFiatDeviationWarning selectedQuote={selectedQuote} />
            <TradingOfferExchangeDetails
                exchangeQuote={selectedQuote}
                providers={providers as TradingExchangeProvidersInfoProps}
                exchange={exchange}
            />

            <Button
                data-testid="@trading/offer/confirm-on-trezor-and-send"
                isLoading={isFormLoading || disabled}
                isDisabled={!device?.connected || disabled}
                onClick={() => handleClick(() => onConfirmAndSendClick())}
                size="large"
                width="100%"
            >
                <Translation id="TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND" />
            </Button>
        </Column>
    );
};
