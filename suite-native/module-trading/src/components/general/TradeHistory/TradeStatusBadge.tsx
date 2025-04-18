import { UnreachableCaseError } from '@suite-common/suite-utils';
import { TradingTransactionStatus } from '@suite-common/trading';
import { Badge, BadgeVariant } from '@suite-native/atoms';
import { IconName } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

export type TransactionStatusProps = {
    status: TradingTransactionStatus;
};

export const getBadgeVariant = (status: TradingTransactionStatus): BadgeVariant => {
    switch (status) {
        case undefined:
        case 'CANCELLED':
            return 'neutral';

        case 'SUCCESS':
        case 'REFUNDED':
            return 'greenSubtle';

        case 'BLOCKED':
        case 'ERROR':
            return 'red';

        default:
            return 'yellow';
    }
};

export const getBadgeIconName = (status: TradingTransactionStatus): IconName | undefined => {
    switch (status) {
        case 'CANCELLED':
        case 'ERROR':
        case 'BLOCKED':
            return 'x';

        case 'SUCCESS':
        case 'REFUNDED':
            return 'check';

        case 'KYC':
            return 'warning';

        case 'PENDING':
        case 'APPROVAL_PENDING':
        case 'CONFIRMING':
        case 'SENDING':
        case 'CONVERTING':
        case 'WAITING_FOR_USER':
        case 'SITE_ACTION_REQUEST':
            return 'clock';

        default:
            return undefined;
    }
};

const getLabel = (status: TradingTransactionStatus) => {
    switch (status) {
        case 'LOGIN_REQUEST':
            return <Translation id="moduleTrading.tradeHistory.status.loginRequest" />;
        case 'REQUESTING':
            return <Translation id="moduleTrading.tradeHistory.status.requesting" />;
        case 'SUBMITTED':
            return <Translation id="moduleTrading.tradeHistory.status.submitted" />;
        case 'APPROVAL_PENDING':
            return <Translation id="moduleTrading.tradeHistory.status.approvalPending" />;
        case 'WAITING_FOR_USER':
            return <Translation id="moduleTrading.tradeHistory.status.waitingForUser" />;
        case 'SUCCESS':
            return <Translation id="moduleTrading.tradeHistory.status.success" />;
        case 'ERROR':
            return <Translation id="moduleTrading.tradeHistory.status.error" />;
        case 'BLOCKED':
            return <Translation id="moduleTrading.tradeHistory.status.blocked" />;
        case 'SITE_ACTION_REQUEST':
            return <Translation id="moduleTrading.tradeHistory.status.siteActionRequest" />;
        case 'SEND_CRYPTO':
            return <Translation id="moduleTrading.tradeHistory.status.sendCrypto" />;
        case 'PENDING':
            return <Translation id="moduleTrading.tradeHistory.status.pending" />;
        case 'CANCELLED':
            return <Translation id="moduleTrading.tradeHistory.status.cancelled" />;
        case 'REFUNDED':
            return <Translation id="moduleTrading.tradeHistory.status.refunded" />;
        case 'LOADING':
            return <Translation id="moduleTrading.tradeHistory.status.loading" />;
        case 'CONFIRM':
            return <Translation id="moduleTrading.tradeHistory.status.confirm" />;
        case 'SENDING':
            return <Translation id="moduleTrading.tradeHistory.status.sending" />;
        case 'CONFIRMING':
            return <Translation id="moduleTrading.tradeHistory.status.confirming" />;
        case 'CONVERTING':
            return <Translation id="moduleTrading.tradeHistory.status.converting" />;
        case 'APPROVAL_REQ':
            return <Translation id="moduleTrading.tradeHistory.status.ApprovalRequired" />;
        case 'SIGN_DATA':
            return <Translation id="moduleTrading.tradeHistory.status.signData" />;
        case 'KYC':
            return <Translation id="moduleTrading.tradeHistory.status.kyc" />;
        case undefined:
            return null;

        default:
            throw new UnreachableCaseError(status);
    }
};

export const TradeStatusBadge = ({ status }: TransactionStatusProps) => {
    if (!status) {
        return null;
    }

    return (
        <Badge
            label={getLabel(status)}
            size="small"
            variant={getBadgeVariant(status)}
            icon={getBadgeIconName(status)}
            accessibilityHint="Trade status badge"
        />
    );
};
