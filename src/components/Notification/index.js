import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import styled, { css } from 'styled-components';
import colors from 'config/colors';
import NotificationButton from 'components/NotificationButton';
import Icon from 'components/Icon';
import icons from 'config/icons';
import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';

import * as NOTIFICATION from 'actions/constants/notification';
import * as NotificationActions from 'actions/NotificationActions';
import Loader from 'components/Loader';

const Wrapper = styled.div`
    position: relative;
    color: ${colors.TEXT_PRIMARY};
    background: ${colors.TEXT_SECONDARY};
    padding: 24px 48px 24px 24px;
    display: flex;
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
`;

const Body = styled.div`
    display: flex;
    margin-right: 40px;
    flex: 1;
`;

const Title = styled.div`
    padding-bottom: 5px;
    font-weight: ${FONT_WEIGHT.BIGGER};
`;

const ActionContent = styled.div``;

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
`;

const MessageContent = styled.div`
    height: 20px;
    display: flex;
`;

const Texts = styled.div`
    display: flex;
    flex-direction: column;
`;

const AdditionalContent = styled.div``;

export const Notification = (props: NProps): React$Element<string> => {
    const close: Function = typeof props.close === 'function' ? props.close : () => {}; // TODO: add default close action

    const getIconColor = (type) => {
        let color;
        switch (type) {
            case 'info':
                color = colors.INFO_PRIMARY;
                break;
            case 'error':
                color = colors.ERROR_PRIMARY;
                break;
            case 'warning':
                color = colors.WARNING_PRIMARY;
                break;
            case 'success':
                color = colors.SUCCESS_PRIMARY;
                break;
            default:
                color = null;
        }

        return color;
    };

    return (
        <Wrapper type={props.className}>
            {props.loading && <Loader size={50} /> }
            {props.cancelable && (
                <CloseClick onClick={() => close()}>
                    <Icon
                        color={getIconColor(props.className)}
                        icon={icons.CLOSE}
                        size={20}
                    />
                </CloseClick>
            )}
            <Body>
                <MessageContent>
                    <StyledIcon
                        color={getIconColor(props.className)}
                        icon={icons[props.className.toUpperCase()]}
                    />
                    <Texts>
                        <Title>{ props.title }</Title>
                        { props.message && (
                            <Message>
                                <p dangerouslySetInnerHTML={{ __html: props.message }} />
                            </Message>
                        ) }
                    </Texts>
                </MessageContent>
            </Body>
            <AdditionalContent>
                {props.actions && props.actions.length > 0 && (
                    <ActionContent>
                        {props.actions.map(action => (
                            <NotificationButton
                                key={action.label}
                                type={props.className}
                                text={action.label}
                                onClick={() => { close(); action.callback(); }}
                            />
                        ))}
                    </ActionContent>
                )}
            </AdditionalContent>
        </Wrapper>
    );
};

export const NotificationGroup = (props) => {
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
    state => ({
        notifications: state.notifications,
    }),
    dispatch => ({
        close: bindActionCreators(NotificationActions.close, dispatch),
    }),
)(NotificationGroup);