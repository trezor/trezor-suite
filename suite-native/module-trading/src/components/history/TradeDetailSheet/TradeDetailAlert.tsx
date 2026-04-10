import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    type TradingTransaction,
    type TradingTransactionBuy,
    type TradingTransactionSell,
    type TradingType,
    getStatusUrl,
    selectTradingProviderByNameAndTradeType,
    selectTradingTradeByOrderId,
} from '@suite-common/trading';
import { FullAlertBox } from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { buildTradingUrl, useBrowserAuth } from '@suite-native/trading-browser-auth';
import { exhaustive } from '@trezor/type-utils';

import { type TradeStatusStep } from '../../../utils/general/utils';

type AlertConfig = {
    iconName: IconName;
    variant: 'critical' | 'neutral' | 'success';
    titleKey: TxKeyPath;
    descriptionKey: TxKeyPath;
    buttonKey: TxKeyPath;
};

type TradeDetailAlertProps = {
    alertType: TradeStatusStep;
    provider?: string;
    tradeType: TradingType;
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
                buttonKey: 'moduleTrading.tradeHistory.detail.errorAlert.button',
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
                buttonKey: 'moduleTrading.tradeHistory.detail.convertingAlert.button',
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
                buttonKey: 'moduleTrading.tradeHistory.detail.sendingAlert.button',
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
    provider,
    tradeType,
    orderId,
    onOpenedBrowser,
}: TradeDetailAlertProps) => {
    const openLink = useOpenLink();

    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, provider, tradeType),
    );
    const trade = useSelector((state: TradingRootState) =>
        orderId ? selectTradingTradeByOrderId(state, orderId) : undefined,
    );
    const { translate } = useTranslate();

    const alertConfig = getAlertConfig(alertType);

    const { openBrowser } = useBrowserAuth(trade?.tradeType);

    // If no config found for this alert type, return null
    if (!alertConfig) {
        return null;
    }

    const { iconName, variant, titleKey, descriptionKey, buttonKey } = alertConfig;

    // todo: separate status url and support url just like on web and desktop
    const supportUrl = providerInfo?.supportUrl;
    const statusOrSupportUrl =
        alertType === 'kyc' ? supportUrl : getStatusUrl(providerInfo, trade?.data) || supportUrl;

    const navigateToBrowser = () => {
        if (trade && isBuyOrSell(trade) && trade.data.partnerData) {
            const callbackUrl = buildTradingUrl({
                actionType: 'trade',
                tradeType: trade.tradeType,
                orderId,
            });
            onOpenedBrowser?.();
            openBrowser(trade.data.partnerData, callbackUrl, orderId);
        }
    };

    // Special handling for different alert types
    let handleButtonPress: (() => void) | undefined;

    if ((['waiting', 'kyc'] as TradeStatusStep[]).includes(alertType) && orderId) {
        handleButtonPress = () => navigateToBrowser();
    }

    if (statusOrSupportUrl) {
        handleButtonPress = () => openLink(statusOrSupportUrl);
    }

    const buttonLabel = handleButtonPress ? translate(buttonKey) : undefined;

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
