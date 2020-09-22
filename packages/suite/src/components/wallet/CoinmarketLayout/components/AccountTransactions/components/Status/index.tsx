import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { getStatusMessage } from '@wallet-utils/coinmarket/buyUtils';
import { colors, variables, Icon } from '@trezor/components';
import { Trade } from '@wallet-reducers/coinmarketReducer';

interface Props {
    status: Trade['data']['status'];
    className?: string;
}

const getData = (status: Trade['data']['status']) => {
    const message = getStatusMessage(status);
    switch (message) {
        case 'TR_BUY_STATUS_PENDING':
            return {
                icon: 'CLOCK',
                color: colors.NEUE_TYPE_ORANGE,
                statusMessageId: message,
            } as const;
        case 'TR_BUY_STATUS_PENDING_GO_TO_GATEWAY':
            return {
                icon: 'CLOCK',
                color: colors.NEUE_TYPE_ORANGE,
                statusMessageId: message,
            } as const;
        case 'TR_BUY_STATUS_ERROR':
            return {
                icon: 'CROSS',
                color: colors.NEUE_TYPE_RED,
                statusMessageId: message,
            } as const;
        case 'TR_BUY_STATUS_SUCCESS':
            return {
                icon: 'CHECK',
                color: colors.NEUE_TYPE_GREEN,
                statusMessageId: message,
            } as const;
        // no default
    }
};

const Status = ({ status, className }: Props) => {
    const data = getData(status);
    return (
        <Wrapper color={data.color} className={className}>
            <StyledIcon color={data.color} size={10} icon={data.icon} />
            <Text>
                <Translation id={data.statusMessageId} />
            </Text>
        </Wrapper>
    );
};

const Wrapper = styled.div<{ color: string }>`
    display: flex;
    color: ${props => props.color};
    align-items: center;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const Text = styled.div`
    padding-top: 1px;
`;

const StyledIcon = styled(Icon)`
    margin-right: 3px;
`;

export default Status;
