/* @flow */


import React from 'react';
import { H2 } from 'components/Heading';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import styled, { css } from 'styled-components';
import colors from 'config/colors';
import Button from 'components/Button';
import Icon from 'components/Icon';
import icons from 'config/icons';

import * as NOTIFICATION from 'actions/constants/notification';
import * as NotificationActions from 'actions/NotificationActions';
import type { Action, State, Dispatch } from 'flowtype';
import Loader from 'components/Loader';

type Props = {
    notifications: $ElementType<State, 'notifications'>,
    close: (notif?: any) => Action
}

type NProps = {
    key?: number;
    className: string;
    cancelable?: boolean;
    title: string;
    message?: string;
    actions?: Array<any>;
    close?: typeof NotificationActions.close,
    loading?: boolean
}

const Wrapper = styled.div`
    position: relative;
    color: ${colors.TEXT_PRIMARY};
    background: ${colors.TEXT_SECONDARY};
    padding: 24px 48px 24px 80px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    text-align: left;

    ${props => props.type === 'info' && css`
        color: ${colors.INFO_PRIMARY};
        background: ${colors.INFO_SECONDARY};
    `}

    ${props => props.type === 'success' && css`
        color: ${colors.SUCCESS_PRIMARY};
        background: ${colors.SUCCESS_SECONDARY};
    `}

    ${props => props.type === 'warning' && css`
        color: ${colors.WARNING_PRIMARY};
        background: ${colors.WARNING_SECONDARY};
    `}

    ${props => props.type === 'error' && css`
        color: ${colors.ERROR_PRIMARY};
        background: ${colors.ERROR_SECONDARY};
    `}
`;

const Body = styled.div`
    flex: 1;
    margin-right: 24px;
`;

const ActionContent = styled.div`
`;

const CloseClick = styled.div``;

export const Notification = (props: NProps): React$Element<string> => {
    const close: Function = typeof props.close === 'function' ? props.close : () => {}; // TODO: add default close action
    const actionButtons = props.actions ? props.actions.map((a, i) => (
        <button key={i} onClick={(event) => { close(); a.callback(); }} className="transparent">{ a.label }</button>
    )) : null;

    return (
        <Wrapper type={props.className}>
            { props.cancelable && (
                <CloseClick onClick={() => close()}>
                    <Icon icon={icons.CLOSE} size={25} />
                </CloseClick>
            )
            }
            <Body>
                <H2>{ props.title }</H2>
                { props.message && <p dangerouslySetInnerHTML={{ __html: props.message }} /> }
            </Body>
            { props.actions && props.actions.length > 0 ? (
                <ActionContent>
                    {props.actions
                        .map(action => (
                            <Button
                                color={props.className}
                                text={action.label}
                                onClick={() => { close(); action.callback(); }}
                            />
                        ))}
                </ActionContent>
            ) : null }
            { props.loading && <Loader size={50} /> }

        </Wrapper>
    );
};

export const NotificationGroup = (props: Props) => {
    const { notifications, close } = props;
    return notifications.map((n, i) => (
        <Notification
            key={i}
            className={n.type}
            title={n.title}
            message={n.message}
            cancelable={n.cancelable}
            actions={n.actions}
            close={close}
        />
    ));
};

export default connect(
    (state: State) => ({
        notifications: state.notifications,
    }),
    (dispatch: Dispatch) => ({
        close: bindActionCreators(NotificationActions.close, dispatch),
    }),
)(NotificationGroup);