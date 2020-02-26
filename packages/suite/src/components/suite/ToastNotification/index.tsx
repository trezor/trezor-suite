import React from 'react';
import styled from 'styled-components';
import { Button, Icon, variables, colors } from '@trezor/components';
import { Translation, AddressLabeling } from '@suite-components';
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

export default ({ icon, message, action, actionLabel }: ViewProps) => {
    if (message.values) {
        if (typeof message.values.txid === 'string') {
            message.values.amount = '00';
        }
        if (typeof message.values.descriptor === 'string') {
            message.values.account = <AddressLabeling address={message.values.descriptor} />;
        }
    }
    return (
        <Wrapper>
            {icon && <Icon icon={icon} size={12} color={colors.WHITE} />}
            <Text>
                <Translation {...message} />
            </Text>
            {action && actionLabel && (
                <Button
                    variant="tertiary"
                    icon="ARROW_RIGHT"
                    alignIcon="right"
                    color={colors.WHITE}
                    onClick={action}
                >
                    <Translation {...actionLabel} />
                </Button>
            )}
        </Wrapper>
    );
};
