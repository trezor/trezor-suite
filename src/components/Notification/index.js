/* @flow */

import React from 'react';
import media from 'styled-media-query';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import styled, { css } from 'styled-components';
import colors from 'config/colors';
import { getColor, getIcon } from 'utils/notification';
import Icon from 'components/Icon';
import icons from 'config/icons';
import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';

import * as NotificationActions from 'actions/NotificationActions';
import Loader from 'components/Loader';
import type { Action, State } from 'flowtype';
import NotificationButton from './components/NotificationButton';

type Props = {
    key?: number,
    notifications: $ElementType<State, 'notifications'>,
    close: (notif?: any) => Action,
};

type NProps = {
    type: string,
    cancelable?: boolean;
    title: string;
    message?: string;
    actions?: Array<any>;
    close?: typeof NotificationActions.close,
    loading?: boolean
};

const Wrapper = styled.div`
    position: relative;
    color: ${colors.TEXT_PRIMARY};
    background: ${colors.TEXT_SECONDARY};
    padding: 24px 48px 24px 24px;
    display: flex;
    min-height: 90px;
    flex-direction: row;
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

    ${media.lessThan('610px')`
        flex-direction: column;
    `}
`;

const Body = styled.div`
    display: flex;
    width: 60%;

    ${media.lessThan('610px')`
        width: 100%;
    `}
`;

const Title = styled.div`
    padding-bottom: 5px;
    font-weight: ${FONT_WEIGHT.BIGGER};
`;

const CloseClick = styled.div`
    position: absolute;
    right: 0;
    top: 0;
    padding: 20px 10px 0 0;
`;

const Message = styled.div`
    font-size: ${FONT_SIZE.SMALLER};
`;

const StyledIcon = styled(Icon)`
    position: relative;
    top: -7px;
    min-width: 20px;
`;

const IconWrapper = styled.div`
    min-width: 20px;
`;

const Texts = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
`;

const AdditionalContent = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    flex: 1;
`;

const ActionContent = styled.div`
    display: flex;
    justify-content: right;
    align-items: flex-end;

    ${media.lessThan('610px')`
        width: 100%;
        padding: 10px 0 0 30px;
        align-items: flex-start;
    `}
`;

export const Notification = (props: NProps): React$Element<string> => {
    const close: Function = typeof props.close === 'function' ? props.close : () => {}; // TODO: add default close action


    return (
        <Wrapper type={props.type}>
            {props.loading && <Loader size={50} /> }
            {props.cancelable && (
                <CloseClick onClick={() => close()}>
                    <Icon
                        color={getColor(props.type)}
                        icon={icons.CLOSE}
                        size={20}
                    />
                </CloseClick>
            )}
            <Body>
                <IconWrapper>
                    <StyledIcon
                        color={getColor(props.type)}
                        icon={getIcon(props.type)}
                    />
                </IconWrapper>
                <Texts>
                    <Title>{ props.title }</Title>
                    { props.message && (
                        <Message>
                            <p dangerouslySetInnerHTML={{ __html: props.message }} />
                        </Message>
                    ) }
                </Texts>
            </Body>
            <AdditionalContent>
                {props.actions && props.actions.length > 0 && (
                    <ActionContent>
                        {props.actions.map(action => (
                            <NotificationButton
                                key={action.label}
                                type={props.type}
                                text={action.label}
                                onClick={() => { close(); action.callback(); }}
                            >{action.label}
                            </NotificationButton>
                        ))}
                    </ActionContent>
                )}
            </AdditionalContent>
        </Wrapper>
    );
};

export const NotificationGroup = (props: Props) => {
    const { notifications, close } = props;
    return notifications.map(n => (
        <Notification
            key={n.title}
            type={n.type}
            title={n.title}
            message={n.message}
            cancelable={n.cancelable}
            actions={n.actions}
            close={close}
        />
    ));
};

export default connect(
    state => ({
        notifications: state.notifications,
    }),
    dispatch => ({
        close: bindActionCreators(NotificationActions.close, dispatch),
    }),
)(NotificationGroup);
