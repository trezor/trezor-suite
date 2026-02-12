import { Translation } from '@suite/intl';
import { selectTradingCoinSymbolByCryptoId } from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { ExchangeInfoNotification } from '@trezor/product-components';

import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import type { NotificationRendererProps } from 'src/components/suite/notifications/NotificationRenderer/NotificationRenderer';
import type { NotificationViewProps } from 'src/components/suite/notifications/Notifications/NotificationGroup/NotificationList/NotificationView';
import { useSelector } from 'src/hooks/suite/useSelector';

import { AccountLabeling } from '../../labeling';

type ExchangeInfoRendererProps = Omit<NotificationViewProps, 'messageValues'> &
    NotificationRendererProps<'tx-exchange'>;

export const ExchangeInfoRenderer = ({ render: View, ...props }: ExchangeInfoRendererProps) => {
    const { send, receive } = props.notification.metadata;

    const sendSymbol = useSelector(state =>
        selectTradingCoinSymbolByCryptoId(state, send.cryptoId),
    );
    const receiveSymbol = useSelector(state =>
        selectTradingCoinSymbolByCryptoId(state, receive.cryptoId),
    );

    const sendAccount = useSelector(state => selectAccountByKey(state, send.accountKey));
    const receiveAccount = useSelector(state => selectAccountByKey(state, receive.accountKey));

    return (
        <View
            {...props}
            message="TOAST_TX_COMPOSED"
            messageValues={{
                content: (
                    <ExchangeInfoNotification
                        message={
                            <Translation
                                id={props.message}
                                values={{
                                    sendAccount: sendAccount && (
                                        <AccountLabeling
                                            account={sendAccount}
                                            showAccountTypeBadge
                                            accountTypeBadgeSize="small"
                                            accountLabelRowProps={{
                                                display: 'inline-flex',
                                                gap: 4,
                                                padding: { left: 4, right: 4 },
                                                'data-testid': '@toast/tx-exchange/send-account',
                                            }}
                                        />
                                    ),
                                    receiveAccount: receiveAccount && (
                                        <AccountLabeling
                                            account={receiveAccount}
                                            showAccountTypeBadge
                                            accountTypeBadgeSize="small"
                                            accountLabelRowProps={{
                                                display: 'inline-flex',
                                                gap: 4,
                                                padding: { left: 4, right: 4 },
                                                'data-testid': '@toast/tx-exchange/receive-account',
                                            }}
                                        />
                                    ),
                                }}
                            />
                        }
                        send={{
                            ...send,
                            displaySymbol: sendSymbol || send.symbol,
                        }}
                        receive={{
                            ...receive,
                            displaySymbol: receiveSymbol || receive.symbol,
                        }}
                        renderAmount={(amount, side) => (
                            <HiddenPlaceholder data-testid={`@toast/tx-exchange/${side}-amount`}>
                                {amount}
                            </HiddenPlaceholder>
                        )}
                    />
                ),
            }}
        />
    );
};
