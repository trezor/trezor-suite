import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type WrapTransactionAsset } from '@suite-common/toast-notifications';
import { ExchangeInfoNotification } from '@trezor/product-components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import type { NotificationRendererProps } from 'src/components/suite/notifications/NotificationRenderer/NotificationRenderer';
import type { NotificationViewProps } from 'src/components/suite/notifications/Notifications/NotificationGroup/NotificationList/NotificationView';

type WrapInfoRendererProps = Omit<NotificationViewProps, 'messageValues'> &
    (NotificationRendererProps<'tx-wrap'> | NotificationRendererProps<'tx-unwrap'>);

const withFormattedAmount = (asset: WrapTransactionAsset) => ({
    ...asset,
    amount: <FormattedCryptoAmount value={asset.amount} isBalance disableHiddenPlaceholder />,
});

export const WrapInfoRenderer = ({ render: View, ...props }: WrapInfoRendererProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { notification } = props;
    const { send, receive } = notification.metadata;

    // Pairs with the `sent` report the thunk fires when this toast is dispatched. In-flow steps
    // report on yield/deposit instead, so counting them here would skew the dismissal rate.
    const handleDismiss = () => {
        if (notification.isYieldFlowStep) {
            return;
        }

        analytics.report({
            type:
                notification.type === 'tx-wrap'
                    ? events.yieldWrapEvent.name
                    : events.yieldUnwrapEvent.name,
            payload: {
                type: 'sent',
                action: 'close',
                networkSymbol: notification.symbol,
            },
        });
    };

    return (
        <View
            {...props}
            onCancel={handleDismiss}
            message="TOAST_TX_COMPOSED"
            messageValues={{
                content: (
                    <ExchangeInfoNotification
                        data-testid="@toast/tx-wrap"
                        message={<Translation id={props.message} />}
                        send={withFormattedAmount(send)}
                        receive={withFormattedAmount(receive)}
                        renderAmount={(amount, side) => (
                            <HiddenPlaceholder data-testid={`@toast/tx-wrap/${side}-amount`}>
                                {amount}
                            </HiddenPlaceholder>
                        )}
                    />
                ),
            }}
        />
    );
};
