import React from 'react';
import styled from 'styled-components';

import * as protocolActions from '@suite-actions/protocolActions';
import { Translation } from '@suite-components';
import { CoinLogo } from '@trezor/components';
import { capitalizeFirstLetter } from '@suite-utils/string';
import { PROTOCOL_TO_NETWORK } from '@suite-constants/protocol';
import withConditionalAction from './withConditionalAction';

import type { NotificationEntry } from '@suite-reducers/notificationReducer';
import type { ViewProps } from '../definitions';
import type { Network } from '@wallet-types';

const Row = styled.span`
    display: flex;
`;

const getIcon = (symbol?: Network['symbol']) => symbol && <CoinLogo symbol={symbol} size={20} />;

export const withAoppProtocol = (
    View: React.ComponentType<ViewProps>,
    notification: Extract<NotificationEntry, { type: 'aopp-protocol' }>,
) =>
    withConditionalAction(View, {
        notification,
        header: <Translation id="TOAST_AOPP_FILL_HEADER" />,
        body: notification.message,
        icon: getIcon(notification.asset),
        actionLabel: 'TOAST_AOPP_FILL_ACTION',
        actionCondition: {
            path: '/accounts/sign-verify',
            network: notification.asset,
        },
        onAction: protocolActions.fillAopp(true),
        onCancel: protocolActions.resetProtocol(),
    });

export const withCoinProtocol = (
    View: React.ComponentType<ViewProps>,
    notification: Extract<NotificationEntry, { type: 'coin-scheme-protocol' }>,
) =>
    withConditionalAction(View, {
        notification,
        header: <Translation id="TOAST_COIN_SCHEME_PROTOCOL_HEADER" />,
        body: (
            <>
                <Row>
                    {notification.amount && `${notification.amount} `}
                    {capitalizeFirstLetter(notification.scheme)}
                </Row>
                <Row>{notification.address}</Row>
            </>
        ),
        actionLabel: 'TOAST_COIN_SCHEME_PROTOCOL_ACTION',
        actionCondition: {
            path: '/accounts/send',
            network: PROTOCOL_TO_NETWORK[notification.scheme],
        },
        onAction: protocolActions.fillSendForm(true),
        onCancel: protocolActions.resetProtocol(),
        icon: getIcon(PROTOCOL_TO_NETWORK[notification.scheme]),
    });
