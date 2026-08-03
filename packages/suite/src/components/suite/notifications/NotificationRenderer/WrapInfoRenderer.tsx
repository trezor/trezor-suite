import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
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
    const { send, receive } = props.notification.metadata;

    return (
        <View
            {...props}
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
