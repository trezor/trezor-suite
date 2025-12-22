import { selectTradingCoinSymbolByCryptoId } from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';

import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import type { NotificationRendererProps } from 'src/components/suite/notifications/NotificationRenderer/NotificationRenderer';
import type { NotificationViewProps } from 'src/components/suite/notifications/Notifications/NotificationGroup/NotificationList/NotificationView';
import { useDefaultAccountLabel } from 'src/hooks/suite';
import { useSelector } from 'src/hooks/suite/useSelector';

type ExchangeInfoRendererProps = Omit<NotificationViewProps, 'messageValues'> &
    NotificationRendererProps<'tx-exchange'>;

export const ExchangeInfoRenderer = ({ render: View, ...props }: ExchangeInfoRendererProps) => {
    const { getDefaultAccountLabel } = useDefaultAccountLabel();

    const { send, receive } = props.notification.metadata;

    const sendSymbol = useSelector(state =>
        selectTradingCoinSymbolByCryptoId(state, send.cryptoId),
    );
    const receiveSymbol = useSelector(state =>
        selectTradingCoinSymbolByCryptoId(state, receive.cryptoId),
    );

    const sendAccount = useSelector(state => selectAccountByKey(state, send.accountKey));
    const receiveAccount = useSelector(state => selectAccountByKey(state, receive.accountKey));

    const sendAccountLabel = sendAccount
        ? (sendAccount.accountLabel ??
          getDefaultAccountLabel({
              accountType: sendAccount.accountType,
              symbol: sendAccount.symbol,
              index: sendAccount.index,
          }))
        : undefined;

    const receiveAccountLabel = receiveAccount
        ? (receiveAccount.accountLabel ??
          getDefaultAccountLabel({
              accountType: receiveAccount.accountType,
              symbol: receiveAccount.symbol,
              index: receiveAccount.index,
          }))
        : undefined;

    return (
        <View
            {...props}
            messageValues={{
                sendAmount: <HiddenPlaceholder>{send.amount}</HiddenPlaceholder>,
                sendAsset: sendSymbol,
                sendAccount: sendAccountLabel,
                receiveAmount: <HiddenPlaceholder>{receive.amount}</HiddenPlaceholder>,
                receiveAsset: receiveSymbol,
                receiveAccount: receiveAccountLabel,
            }}
        />
    );
};
