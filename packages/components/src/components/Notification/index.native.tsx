import * as React from 'react';
import styled from 'styled-components/native';

import { FONT_SIZE_NATIVE, FONT_WEIGHT } from '../../config/variables';
import { getPrimaryColor, getNotificationBgColor } from '../../utils/colors';
import { getStateIcon } from '../../utils/icons';
import Icon from '../Icon';
import Button from '../buttons/Button';
import icons from '../../config/icons';
import { FeedbackType } from '../../support/types';

const Wrapper = styled.View<WrapperProps>`
    width: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    color: ${props => getPrimaryColor(props.variant)};
    background: ${props => getNotificationBgColor(props.variant)};
    margin-bottom: 15;
`;

const Content = styled.View`
    width: 100%;
    max-width: 1170px;
    padding: 24px 24px 14px 24px;
    display: flex;
    flex-direction: row;
    text-align: left;
    align-items: center;
`;

const Col = styled.View`
    flex: 1;
    align-self: flex-start;
`;

const Body = styled.View`
    flex: 1;
    flex-direction: row;
    align-items: center;
    padding-bottom: 10px;
`;

const Message = styled.Text<TextProps>`
    color: ${props => props.color};
    font-size: ${FONT_SIZE_NATIVE.SMALL};
`;

const Title = styled.Text<TextProps>`
    padding-bottom: 5px;
    padding-top: 1px;
    font-weight: ${FONT_WEIGHT.MEDIUM};
    color: ${props => props.color};
`;

const CloseClick = styled.TouchableHighlight`
    margin-left: 24px;
    align-self: flex-start;
`;

const StyledIcon = styled(Icon)`
    position: relative;
    min-width: 20px;
`;

const IconWrapper = styled.View`
    min-width: 30px;
`;

const Texts = styled.View`
    flex: 1;
    padding: 0 10px 0 0;
    flex-direction: column;
`;

const AdditionalContent = styled.View`
    flex: 1;
    justify-content: center;
    align-items: flex-end;
    padding-top: 10px;
`;

const ActionContent = styled.View`
    flex: 1;
    justify-content: flex-end;
    align-items: flex-end;
`;

const ButtonNotification = styled(Button)`
    padding: 12px 36px;
`;

interface CtaShape {
    label: string;
    callback: () => any;
}

interface TextProps {
    color?: string;
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
                            <Title color={stateColor}>{title}</Title>
                            {message ? <Message color={stateColor}>{message}</Message> : ''}
                        </Texts>
                        {actions && actions.length > 0 && (
                            <AdditionalContent>
                                <ActionContent>
                                    {actions.map((action: CtaShape) => (
                                        <ButtonNotification
                                            isInverse
                                            key={action.label}
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
                            </AdditionalContent>
                        )}
                    </Body>
                </Col>
                {cancelable && (
                    <CloseClick onPress={() => closeFunc()}>
                        <Icon color={stateColor} icon={icons.CLOSE} size={10} />
                    </CloseClick>
                )}
            </Content>
        </Wrapper>
    );
};

export default Notification;
