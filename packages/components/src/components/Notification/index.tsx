import * as React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import { FONT_SIZE, FONT_WEIGHT } from '../../config/variables';
import { getPrimaryColor, getNotificationBgColor } from '../../utils/colors';
import { getStateIcon } from '../../utils/icons';
import Icon from '../Icon';
import Button from '../buttons/Button';
import { FeedbackType } from '../../support/types';

const Wrapper = styled.div<WrapperProps>`
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

interface CtaShape {
    label: React.ReactNode;
    callback: () => any;
}

interface WrapperProps {
    className?: string;
    variant?: FeedbackType;
}
interface Props {
    className?: string;
    title: React.ReactNode;
    message?: React.ReactNode;
    actions?: CtaShape[];
    cancelable?: boolean;
    isActionInProgress?: boolean;
    variant?: FeedbackType;
    close?: () => any;
}

const Notification = ({
    className,
    variant = 'info',
    title,
    message,
    actions,
    cancelable,
    isActionInProgress,
    close,
    ...rest
}: Props) => {
    const closeFunc = typeof close === 'function' ? close : () => {}; // TODO: add default close action
    const stateIcon = getStateIcon(variant);
    const stateColor = getPrimaryColor(variant) || undefined;
    if (!stateIcon || !stateColor) return null;

    return (
        <Wrapper className={className} variant={variant} {...rest}>
            <Content>
                <Col>
                    <Body>
                        <IconWrapper>
                            <StyledIcon color={stateColor} icon={stateIcon} size={16} />
                        </IconWrapper>
                        <Texts>
                            <Title>{title}</Title>
                            {message ? <Message>{message}</Message> : ''}
                        </Texts>
                    </Body>
                    <AdditionalContent>
                        {actions && actions.length > 0 && (
                            <ActionContent>
                                {actions.map((action: CtaShape, i) => (
                                    <ButtonNotification
                                        isInverse
                                        // eslint-disable-next-line react/no-array-index-key
                                        key={i}
                                        variant={variant}
                                        isLoading={isActionInProgress}
                                        onClick={() => {
                                            closeFunc();
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
                {cancelable && (
                    <CloseClick onClick={() => closeFunc()}>
                        <Icon color={stateColor} icon="CLOSE" size={10} />
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
    actions: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string,
            callback: PropTypes.func,
        })
    ),
    className: PropTypes.string,
};

export default Notification;
