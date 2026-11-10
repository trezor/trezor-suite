import { type TransactionNotification } from '@suite-common/toast-notifications';
import { type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';

import { getTxNotificationFields } from '../components/notifications/utils';

export const notificationsToTokenMetadataSources = (
    notifications: readonly TransactionNotification[],
): TokenMetadataSource[] =>
    notifications.map(notification => {
        const { symbol, token } = getTxNotificationFields(notification);

        return {
            networkSymbol: symbol,
            tokens: token ? [{ ...token, contract: toTokenAddress(token.contract) }] : [],
        };
    });
