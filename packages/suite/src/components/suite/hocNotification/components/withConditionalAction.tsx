import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';

import { useSelector } from '@suite-hooks';
import { variables } from '@trezor/components';

import type { NotificationEntry } from '@suite-reducers/notificationReducer';
import type { Dispatch, Action, ExtendedMessageDescriptor } from '@suite-types';
import type { Network } from '@wallet-types';
import type { ViewProps } from '../definitions';

const Header = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-top: 1px;
`;

const Body = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-top: 1px;
`;

type WithConditionalActionProps = {
    notification: NotificationEntry;
    header: React.ReactNode;
    body: React.ReactNode;
    icon?: JSX.Element;
    actionLabel: ExtendedMessageDescriptor['id'];
    actionCondition: {
        path?: string;
        network?: Network['symbol'];
    };
    onAction: Action;
    onCancel: Action;
};

const withConditionalAction = (
    View: React.ComponentType<ViewProps>,
    props: WithConditionalActionProps,
) => {
    const WrappedView = connect()(({ dispatch }: { dispatch: Dispatch }) => {
        const {
            notification,
            header,
            body,
            icon,
            actionCondition: { path, network },
            actionLabel,
            onAction,
            onCancel,
        } = props;

        const { selectedAccount } = useSelector(state => ({
            selectedAccount: state.wallet.selectedAccount,
        }));

        const actionAllowed =
            (!path || useRouteMatch(`${process.env.ASSET_PREFIX || ''}${path}`)) &&
            (!network || selectedAccount?.network?.symbol === network);

        const action = actionAllowed
            ? ({
                  onClick: () => dispatch(onAction),
                  label: actionLabel,
                  position: 'bottom',
                  variant: 'primary',
              } as const)
            : undefined;

        const message = {
            id: 'TOAST_COIN_SCHEME_PROTOCOL',
            values: {
                header: <Header>{header}</Header>,
                body: <Body>{body}</Body>,
            },
        } as const;

        return (
            <View
                variant="transparent"
                notification={notification}
                message={message}
                icon={icon}
                action={action}
                onCancel={() => dispatch(onCancel)}
            />
        );
    });
    return <WrappedView key={props.notification.id} />;
};

export default withConditionalAction;
