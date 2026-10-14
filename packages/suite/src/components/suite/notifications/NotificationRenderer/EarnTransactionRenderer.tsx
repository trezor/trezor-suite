import { type TranslationKey } from '@suite/intl';
import { type EarnTransactionStage } from '@suite-common/toast-notifications';
import { type EarnTransactionToastType } from '@suite-common/wallet-core';
import { PiggyBankIcon } from '@trezor/icons';

import type { NotificationRendererProps } from 'src/components/suite/notifications/NotificationRenderer/NotificationRenderer';

import { TransactionRenderer } from './TransactionRenderer';

type EarnTransactionRendererProps = NotificationRendererProps<EarnTransactionToastType> & {
    messages: Record<EarnTransactionStage, TranslationKey>;
};

export const EarnTransactionRenderer = ({
    render,
    notification,
    messages,
}: EarnTransactionRendererProps) => (
    <TransactionRenderer
        render={render}
        notification={notification}
        icon={PiggyBankIcon}
        variant={notification.stage === 'confirmed' ? 'success' : 'warning'}
        message={messages[notification.stage]}
        messageValues={{}}
    />
);
