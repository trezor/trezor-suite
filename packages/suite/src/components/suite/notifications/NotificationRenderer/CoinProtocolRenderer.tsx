import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { goto , selectRouteName } from '@suite/router';
import { getNetworkSymbolForProtocol } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    NetworkSymbol,
    getNetworkDisplaySymbol,
    getNetworkDisplaySymbolName,
} from '@suite-common/wallet-config';
import { selectDeviceAccountsByNetworkSymbol } from '@suite-common/wallet-core';
import { isBech32AddressUppercase } from '@suite-common/wallet-utils';
import { Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { fillSendForm, resetProtocol } from 'src/actions/suite/protocolActions';
import type { NotificationRendererProps } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { globalSendReceiveFilters } from 'src/slices/wallet/globalSendReceiveFilters';

import { ConditionalActionRenderer } from './ConditionalActionRenderer';

const Row = styled.span`
    display: flex;
`;

const getIcon = (symbol?: NetworkSymbol) => symbol && <CoinLogo symbol={symbol} size={24} />;

export const CoinProtocolRenderer = ({
    render,
    notification,
}: NotificationRendererProps<'coin-scheme-protocol'>) => {
    const dispatch = useDispatch();
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const routeName = useSelector(selectRouteName);

    const networkSymbol = getNetworkSymbolForProtocol(notification.scheme) ?? null;
    const displaySymbol = networkSymbol && getNetworkDisplaySymbol(networkSymbol);
    const networkName = networkSymbol && getNetworkDisplaySymbolName(networkSymbol);
    const networkAccounts = useSelector(state =>
        selectDeviceAccountsByNetworkSymbol(state, networkSymbol),
    ).filter(a => new BigNumber(a.balance).gt(0));
    const isOnSendPage =
        routeName === 'wallet-send' && selectedAccount?.network?.symbol === networkSymbol;

    const onCancel = (reset: boolean = true) => {
        dispatch(notificationsActions.close(notification.id));
        if (reset) {
            dispatch(resetProtocol());
        }
    };

    const handleContinue = () => {
        if (isOnSendPage) {
            dispatch(fillSendForm(true));
        } else {
            if (networkSymbol) {
                dispatch(fillSendForm(true));

                if (networkAccounts.length === 1) {
                    const account = networkAccounts[0];
                    dispatch(
                        goto({ routeName: 'wallet-send', params: {
                                symbol: account.symbol,
                                accountIndex: account.index,
                                accountType: account.accountType,
                            }, }),
                    );
                } else {
                    dispatch(globalSendReceiveFilters.actions.setNetworkSymbol(networkSymbol));
                    dispatch(
                        goto({ routeName: 'suite-index', params: {
                                modal: 'send',
                                networkSymbol,
                            }, }),
                    );
                }
            }
        }

        onCancel(false);
    };

    const renderAddress = () => {
        if (networkSymbol === 'btc' && isBech32AddressUppercase(notification.address)) {
            return notification.address.toLowerCase();
        }

        return notification.address;
    };

    return (
        <ConditionalActionRenderer
            render={render}
            notification={notification}
            header={
                <Translation
                    id="TOAST_COIN_SCHEME_PROTOCOL_HEADER"
                    values={{ symbol: networkName?.toLowerCase() }}
                />
            }
            body={
                <>
                    <Row>
                        <Text typographyStyle="body-sm">{renderAddress()}</Text>
                    </Row>
                    {notification.amount && (
                        <>
                            <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                                <Translation id="TOAST_COIN_SCHEME_PROTOCOL_AMOUNT" />
                            </Text>
                            &nbsp;
                            <Text typographyStyle="body-sm">
                                {notification.amount} {displaySymbol}
                            </Text>
                        </>
                    )}
                </>
            }
            actionLabel="TR_CONTINUE"
            actionAllowed
            onAction={handleContinue}
            onCancel={onCancel}
            icon={getIcon(networkSymbol ?? undefined)}
        />
    );
};
