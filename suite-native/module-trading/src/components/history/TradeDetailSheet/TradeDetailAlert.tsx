import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    type TradingTransaction,
    type TradingTransactionBuy,
    type TradingTransactionSell,
    selectTradingTradeByOrderId,
} from '@suite-common/trading';
import { FullAlertBox } from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';
import { buildTradingUrl, useBrowserAuth } from '@suite-native/trading-browser-auth';
import { exhaustive } from '@trezor/type-utils';

import { type TradeStatusStep } from '../../../utils/general/utils';

type AlertConfig = {
    iconName: IconName;
    variant: 'critical' | 'neutral' | 'success';
    titleKey: TxKeyPath;
    descriptionKey: TxKeyPath;
    buttonKey?: TxKeyPath;
};

type TradeDetailAlertProps = {
    alertType: TradeStatusStep;
    orderId?: string;
    onOpenedBrowser?: () => void;
};

const isBuyOrSell = (
    trade?: TradingTransaction,
): trade is TradingTransactionBuy | TradingTransactionSell =>
    !!trade && ['buy', 'sell'].includes(trade.tradeType);

const getAlertConfig = (alertType: TradeStatusStep): AlertConfig | undefined => {
    switch (alertType) {
        case 'error':
            return {
                iconName: 'warningCircle',
                variant: 'critical',
                titleKey: 'moduleTrading.tradeHistory.detail.errorAlert.title',
                descriptionKey: 'moduleTrading.tradeHistory.detail.errorAlert.description',
            };
        case 'waiting':
            return {
                iconName: 'hourglass',
                variant: 'neutral',
                titleKey: 'moduleTrading.tradeHistory.detail.waitingAlert.title',
                descriptionKey: 'moduleTrading.tradeHistory.detail.waitingAlert.description',
                buttonKey: 'moduleTrading.tradeHistory.detail.waitingAlert.button',
            };
        case 'converting':
            return {
                iconName: 'hourglass',
                variant: 'neutral',
                titleKey: 'moduleTrading.tradeHistory.detail.convertingAlert.title',
                descriptionKey: 'moduleTrading.tradeHistory.detail.convertingAlert.description',
            };
        case 'kyc':
            return {
                iconName: 'magnifyingGlass',
                variant: 'neutral',
                titleKey: 'moduleTrading.tradeHistory.detail.kycAlert.title',
                descriptionKey: 'moduleTrading.tradeHistory.detail.kycAlert.description',
                buttonKey: 'moduleTrading.tradeHistory.detail.kycAlert.button',
            };
        case 'sending':
            return {
                iconName: 'hourglass',
                variant: 'neutral',
                titleKey: 'moduleTrading.tradeHistory.detail.sendingAlert.title',
                descriptionKey: 'moduleTrading.tradeHistory.detail.sendingAlert.description',
            };
        // Success, pending, processing will be handled outside of this component
        case 'success':
        case 'pending':
        case 'processing':
        case undefined:
            return undefined;

        default:
            return exhaustive(alertType);
    }
};

export const TradeDetailAlert = ({
    alertType,
    orderId,
    onOpenedBrowser,
}: TradeDetailAlertProps) => {
    const { translate } = useTranslate();

    const trade = useSelector((state: TradingRootState) =>
        orderId ? selectTradingTradeByOrderId(state, orderId) : undefined,
    );

    const alertConfig = getAlertConfig(alertType);

    const { openBrowser } = useBrowserAuth(trade?.tradeType);

    if (!alertConfig || !trade) {
        return null;
    }

    const { iconName, variant, titleKey, descriptionKey, buttonKey } = alertConfig;
    const { tradeType } = trade;

    const hasPartnerData = isBuyOrSell(trade) && trade.data.partnerData;
    const shouldShowPaymentButton = alertType === 'waiting' && orderId && hasPartnerData;
    const buttonLabel = shouldShowPaymentButton && buttonKey ? translate(buttonKey) : undefined;

    const handleButtonPress = () => {
        if (shouldShowPaymentButton && trade.data.partnerData) {
            const callbackUrl = buildTradingUrl({
                actionType: 'trade',
                tradeType,
                orderId,
            });
            onOpenedBrowser?.();
            openBrowser(trade.data.partnerData, callbackUrl, orderId);
        }
    };

    return (
        <FullAlertBox
            title={translate(titleKey)}
            description={translate(descriptionKey)}
            iconName={iconName}
            primaryButtonLabel={buttonLabel}
            primaryButtonProps={{ iconLeft: 'arrowSquareOut' }}
            onPressPrimaryButton={handleButtonPress}
            variant={variant}
        />
    );
};
