import React from 'react';
import styled from 'styled-components';
import { Button, Icon, variables, colors } from '@trezor/components';
import { Translation } from '@suite-components';
import { ViewProps } from '@suite-components/hocNotification';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const Text = styled.div`
    padding: 0px 16px;
    flex: 1;
`;

// button margin-left: auto;

const ToastNotification = ({ icon, message, action, actionLabel }: ViewProps) => (
    <Wrapper data-test="@toast">
        {icon && <Icon icon={icon} size={12} color={colors.WHITE} />}
        <Text>
            <Translation {...message} />
        </Text>
        {action && actionLabel && (
            <Button variant="tertiary" icon="ARROW_RIGHT" alignIcon="right" onClick={action}>
                <Translation {...actionLabel} />
            </Button>
        )}
    </Wrapper>
);

export default ToastNotification;
