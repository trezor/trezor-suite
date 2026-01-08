import { Translation } from '@suite/intl';
import { selectTradingCoinSymbolByCryptoId } from '@suite-common/trading';
import { getDisplaySymbol, getNetwork } from '@suite-common/wallet-config';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { Column, Icon, Row } from '@trezor/components';
import { AssetLogo } from '@trezor/product-components';

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

    const sendNetwork = getNetwork(send.symbol);
    const receiveNetwork = getNetwork(receive.symbol);

    const sendAccount = useSelector(state => selectAccountByKey(state, send.accountKey));
    const receiveAccount = useSelector(state => selectAccountByKey(state, receive.accountKey));

    return (
        <View
            {...props}
            message="TOAST_TX_COMPOSED"
            messageValues={{
                content: (
                    <Column gap={4}>
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
                        <Row gap={8} alignItems="center">
                            <AssetLogo
                                size={20}
                                coingeckoId={sendNetwork.coingeckoId!}
                                contractAddress={send.contractAddress}
                                symbol={send.symbol}
                                placeholder={getDisplaySymbol(sendSymbol || send.symbol)}
                            />
                            <HiddenPlaceholder data-testid="@toast/tx-exchange/send-amount">
                                {send.amount}
                            </HiddenPlaceholder>
                            {getDisplaySymbol(sendSymbol || send.symbol)}
                            <Icon name="arrowRight" variant="tertiary" size="mediumLarge" />
                            <AssetLogo
                                size={20}
                                coingeckoId={receiveNetwork.coingeckoId!}
                                contractAddress={receive.contractAddress}
                                symbol={receive.symbol}
                                placeholder={getDisplaySymbol(receiveSymbol || receive.symbol)}
                            />
                            <HiddenPlaceholder data-testid="@toast/tx-exchange/receive-amount">
                                {receive.amount}
                            </HiddenPlaceholder>
                            {getDisplaySymbol(receiveSymbol || receive.symbol)}
                        </Row>
                    </Column>
                ),
            }}
        />
    );
};
