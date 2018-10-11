/* @flow */

import * as React from 'react';
import styled, { css } from 'styled-components';
import colors from 'config/colors';
import { getColor, getIcon } from 'utils/notification';
import Icon from 'components/Icon';
import icons from 'config/icons';
import { FONT_WEIGHT, FONT_SIZE } from 'config/variables';

import * as NotificationActions from 'actions/NotificationActions';
import Loader from 'components/Loader';
import type { CallbackAction } from 'reducers/NotificationReducer';

import NotificationButton from './components/NotificationButton';

type Props = {
    type: string,
    cancelable?: boolean;
    title: string;
    className?: string;
    message?: string;
    actions?: Array<CallbackAction>;
    close?: typeof NotificationActions.close,
    loading?: boolean
};

const Wrapper = styled.div`
    width: 100%;
    position: relative;
    color: ${colors.TEXT_PRIMARY};
    background: ${colors.TEXT_SECONDARY};
    padding: 24px 48px 9px 24px;
    display: flex;
    flex-direction: row;
    text-align: left;
    justify-content: center;
    align-items: center;

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
    display: flex;
`;

const Message = styled.div`
    padding-bottom: 13px;
    font-size: ${FONT_SIZE.SMALLER};
`;

const Title = styled.div`
    padding-bottom: 5px;
    padding-top: 1px;
    font-weight: ${FONT_WEIGHT.BIGGER};
`;

const CloseClick = styled.div`
    position: absolute;
    right: 0;
    top: 0;
    padding: 20px 10px 0 0;
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
    padding: 0 10px 0 0;
    flex-direction: column;
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
    padding-bottom: 14px;
`;

const Notification = (props: Props): React$Element<string> => {
    const close: Function = typeof props.close === 'function' ? props.close : () => {}; // TODO: add default close action

    return (
        <Wrapper className={props.className} type={props.type}>
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
                    { props.message ? <Message>{props.message}</Message> : '' }
                </Texts>
            </Body>
            <AdditionalContent>
                {props.actions && props.actions.length > 0 && (
                    <ActionContent>
                        {props.actions.map(action => (
                            <NotificationButton
                                key={action.label}
                                type={props.type}
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

export default Notification;