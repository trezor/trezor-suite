import { type TradingTransactionStatus } from '@suite-common/trading';
import { RoundedIcon, type RoundedIconIntent } from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';
import { exhaustive } from '@trezor/type-utils';

type TradeStatusIconConfig = {
    iconName: IconName;
    intent: RoundedIconIntent;
    accessibilityLabelId: TxKeyPath;
};

export const getTradeStatusIconConfig = (
    status: TradingTransactionStatus,
): TradeStatusIconConfig | undefined => {
    switch (status) {
        case undefined:
            return undefined;

        case 'SUCCESS':
            return {
                iconName: 'check',
                intent: 'brand',
                accessibilityLabelId: 'moduleTrading.tradeHistory.statusIcon.success',
            };

        case 'ERROR':
        case 'BLOCKED':
        case 'REFUNDED':
            return {
                iconName: 'warningCircle',
                intent: 'critical',
                accessibilityLabelId: 'moduleTrading.tradeHistory.statusIcon.error',
            };

        case 'CANCELLED':
        case 'KYC':
            return {
                iconName: 'warning',
                intent: 'warning',
                accessibilityLabelId: 'moduleTrading.tradeHistory.statusIcon.warning',
            };

        case 'LOGIN_REQUEST':
        case 'REQUESTING':
        case 'SUBMITTED':
        case 'APPROVAL_PENDING':
        case 'WAITING_FOR_USER':
        case 'SITE_ACTION_REQUEST':
        case 'SEND_CRYPTO':
        case 'PENDING':
        case 'LOADING':
        case 'CONFIRM':
        case 'SENDING':
        case 'CONFIRMING':
        case 'CONVERTING':
        case 'APPROVAL_REQ':
        case 'SIGN_DATA':
            return {
                iconName: 'spinner',
                intent: 'warning',
                accessibilityLabelId: 'moduleTrading.tradeHistory.statusIcon.pending',
            };

        default:
            return exhaustive(status);
    }
};

type TradeStatusIconProps = {
    status: TradingTransactionStatus;
};

export const TradeStatusIcon = ({ status }: TradeStatusIconProps) => {
    const { translate } = useTranslate();
    const config = getTradeStatusIconConfig(status);

    if (!config) {
        return null;
    }

    return (
        <RoundedIcon
            name={config.iconName}
            intent={config.intent}
            size={24}
            accessibilityLabel={translate(config.accessibilityLabelId)}
            accessibilityRole="image"
            testID="@trading/history/status-icon"
        />
    );
};
