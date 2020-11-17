import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';

const Wrapper = styled.div`
    padding: 2px 2px 0px;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const WrapperNotification = styled.div``;

const WrapperRest = styled.div``;

const Notification = styled.div`
    position: relative;
    width: 18px;
    height: 18px;
    margin-right: 4px;
`;

const NotificationOuterCircle = styled.div`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    width: 18px;
    height: 18px;
    opacity: 0.13;
    background: ${props => props.theme.BG_GREEN};
`;

const NotificationInnerCircle = styled.div`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${props => props.theme.BG_GREEN};
`;

const NavigationLink = styled.span`
    text-decoration: underline;
    cursor: pointer;
`;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    active: boolean;
    action: () => void;
}

const TooltipContentTor = (props: Props) => {
    return (
        <Wrapper>
            {props.active && (
                <WrapperNotification>
                    <Notification>
                        <NotificationOuterCircle />
                        <NotificationInnerCircle />
                    </Notification>
                </WrapperNotification>
            )}
            <WrapperRest>
                <Translation id="TR_TOR" />{' '}
                {props.active ? <Translation id="TR_ACTIVE" /> : <Translation id="TR_INACTIVE" />} (
                <NavigationLink onClick={props.action}>
                    <Translation id="TR_MANAGE" />
                </NavigationLink>
                )
            </WrapperRest>
        </Wrapper>
    );
};

export default TooltipContentTor;
