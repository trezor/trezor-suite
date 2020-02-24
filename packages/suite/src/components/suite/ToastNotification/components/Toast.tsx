import React from 'react';
import styled from 'styled-components';
import { Button, Icon, variables, colors } from '@trezor/components';

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

type Props = {
    text: JSX.Element | string;
    action?: (_event: any) => void;
    actionLabel?: JSX.Element | string;
};

export default ({ text, action, actionLabel }: Props) => {
    return (
        <Wrapper>
            <Icon icon="INFO" size={12} color={colors.WHITE} />
            <Text>{text}</Text>
            {action && actionLabel && (
                <Button
                    variant="tertiary"
                    icon="ARROW_RIGHT"
                    alignIcon="right"
                    color={colors.WHITE}
                    onClick={action}
                >
                    {actionLabel}
                </Button>
            )}
        </Wrapper>
    );
};
