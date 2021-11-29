import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { useRouteMatch } from 'react-router-dom';

import * as protocolActions from '@suite-actions/protocolActions';

import { useSelector } from '@suite-hooks';
import { Translation } from '@suite-components';
import { CoinLogo, variables } from '@trezor/components';
import { capitalizeFirstLetter } from '@suite-utils/string';
import { PROTOCOL_TO_NETWORK } from '@suite-constants/protocol';

import type { NotificationEntry } from '@suite-reducers/notificationReducer';
import type { Dispatch } from '@suite-types';
import type { ViewProps } from '../definitions';

type StrictViewProps = ViewProps & {
    notification: Extract<NotificationEntry, { type: 'coin-scheme-protocol' }>;
};

const Header = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-top: 1px;
`;

const Body = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-top: 1px;
`;

const Row = styled.span`
    display: flex;
`;

const withCoinProtocolScheme = (View: React.ComponentType<ViewProps>, props: StrictViewProps) => {
    const WrappedView = connect()(({ dispatch }: { dispatch: Dispatch }) => {
        const { message, notification } = props;

        const { selectedAccount } = useSelector(state => ({
            selectedAccount: state.wallet.selectedAccount,
        }));

        if (typeof message !== 'string') {
            message.values = {
                header: (
                    <Header>
                        <Translation id="TOAST_COIN_SCHEME_PROTOCOL_HEADER" />
                    </Header>
                ),
                body: (
                    <Body>
                        <Row>
                            {notification.amount && `${notification.amount} `}
                            {capitalizeFirstLetter(notification.scheme)}
                        </Row>
                        <Row>{notification.address}</Row>
                    </Body>
                ),
            };
        }

        const isCorrectCoinSendForm =
            useRouteMatch(`${process.env.ASSET_PREFIX || ''}/accounts/send`) &&
            selectedAccount?.network?.symbol === PROTOCOL_TO_NETWORK[notification.scheme];

        return (
            <View
                {...props}
                action={
                    isCorrectCoinSendForm
                        ? {
                              onClick: () => dispatch(protocolActions.fillSendForm(true)),
                              label: 'TOAST_COIN_SCHEME_PROTOCOL_ACTION',
                              position: 'bottom',
                              variant: 'primary',
                          }
                        : undefined
                }
                icon={<CoinLogo symbol={PROTOCOL_TO_NETWORK[notification.scheme] as any} size={20} />}
                onCancel={() => dispatch(protocolActions.resetProtocol())}
            />
        );
    });
    return <WrappedView key={props.notification.id} />;
};

export default withCoinProtocolScheme;
