import * as React from 'react';

import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';
import { getPrimaryColor, getNotificationBgColor } from 'utils/colors';
import { getStateIcon } from 'utils/icons';

import Icon from 'components/Icon';
import Button from 'components/buttons/Button';
import icons from 'config/icons';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const Wrapper = styled.div`
    width: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    color: ${props => getPrimaryColor(props.variant)};
    background: ${props => getNotificationBgColor(props.variant)};
`;

const Content = styled.div`
    width: 100%;
    max-width: 1170px;
    padding: 24px 24px 14px 24px;
    display: flex;
    flex-direction: row;
    text-align: left;
    align-items: center;
`;

const Col = styled.div`
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    align-self: flex-start;
`;

const Body = styled.div`
    display: flex;
    flex: 1 1 auto;
    padding-bottom: 10px;
`;

const Message = styled.div`
    font-size: ${FONT_SIZE.SMALL};
`;

const Title = styled.div`
    padding-bottom: 5px;
    padding-top: 1px;
    font-weight: ${FONT_WEIGHT.MEDIUM};
`;

const CloseClick = styled.div`
    margin-left: 24px;
    align-self: flex-start;
    cursor: pointer;
`;

const StyledIcon = styled(Icon)`
    position: relative;
    min-width: 20px;
`;

const IconWrapper = styled.div`
    min-width: 30px;
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
    flex: 1 1 auto;
    padding-left: 30px;
    padding-bottom: 10px;
`;

const ActionContent = styled.div`
    display: flex;
    justify-content: right;
    align-items: flex-end;
`;

const ButtonNotification = styled(Button)`
    padding: 12px 36px;
`;

const Notification = props => {
    const close = typeof props.close === 'function' ? props.close : () => {}; // TODO: add default close action

    return (
        <Wrapper className={props.className} variant={props.variant}>
            <Content>
                <Col>
                    <Body>
                        <IconWrapper>
                            <StyledIcon
                                color={getPrimaryColor(props.variant)}
                                icon={getStateIcon(props.variant)}
                                size={16}
                            />
                        </IconWrapper>
                        <Texts>
                            <Title>{props.title}</Title>
                            {props.message ? <Message>{props.message}</Message> : ''}
                        </Texts>
                    </Body>
                    <AdditionalContent>
                        {props.actions && props.actions.length > 0 && (
                            <ActionContent>
                                {props.actions.map(action => (
                                    <ButtonNotification
                                        isInverse
                                        key={action.label}
                                        variant={props.variant}
                                        isLoading={props.isActionInProgress}
                                        onClick={() => {
                                            close();
                                            action.callback();
                                        }}
                                    >
                                        {action.label}
                                    </ButtonNotification>
                                ))}
                            </ActionContent>
                        )}
                    </AdditionalContent>
                </Col>
                {props.cancelable && (
                    <CloseClick onClick={() => close()}>
                        <Icon color={getPrimaryColor(props.variant)} icon={icons.CLOSE} size={10} />
                    </CloseClick>
                )}
            </Content>
        </Wrapper>
    );
};

Notification.propTypes = {
    close: PropTypes.func,
    variant: PropTypes.oneOf(['success', 'info', 'warning', 'error']),
    title: PropTypes.node,
    message: PropTypes.node,
    cancelable: PropTypes.bool,
    isActionInProgress: PropTypes.bool,
    actions: PropTypes.array,
    className: PropTypes.string,
};

export default Notification;
