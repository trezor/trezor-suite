import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import styled, { css } from 'styled-components';
import colors from 'config/colors';
import Button from 'components/Button';
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
    display: flex;
    margin-right: 40px;
`;

const Title = styled.div`
    font-weight: ${FONT_WEIGHT.BIGGER};
`;

const ActionContent = styled.div``;
const CloseClick = styled.div``;

const Message = styled.div`
    padding: 5px 0 0 0;
    font-size: ${FONT_SIZE.SMALLER};
`;

const IconContent = styled.div`
    padding-right: 5px;
`;

const StyledIcon = styled(Icon)`
    position: relative;
    top: -6px;
`;

const MessageContent = styled.div``;

export const Notification = (props: NProps): React$Element<string> => {
    const close: Function = typeof props.close === 'function' ? props.close : () => {}; // TODO: add default close action

    const getButtonColor = (type) => {
        let color;
        switch (type) {
            case 'info':
                color = 'blue';
                break;
            case 'error':
                color = 'red';
                break;
            case 'warning':
                color = 'orange';
                break;
            case 'success':
                color = 'green';
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
                    <Icon icon={icons.CLOSE} size={25} />
                </CloseClick>
            )}
            <Body>
                <IconContent>
                    <StyledIcon icon={icons[props.className.toUpperCase()]} />
                </IconContent>
                <MessageContent>
                    <Title>{ props.title }</Title>
                    { props.message && (
                        <Message>
                            <p dangerouslySetInnerHTML={{ __html: props.message }} />
                        </Message>
                    ) }
                </MessageContent>
            </Body>
            {props.actions && props.actions.length > 0 && (
                <ActionContent>
                    {props.actions
                        .map(action => (
                            <Button
                                key={action.label}
                                color={getButtonColor(props.className)}
                                text={action.label}
                                onClick={() => { close(); action.callback(); }}
                            />
                        ))}
                </ActionContent>
            )}
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