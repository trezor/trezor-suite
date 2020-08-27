import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { colors, variables, Icon } from '@trezor/components';
import { Trade } from '@wallet-reducers/coinmarketReducer';

interface Props {
    status: Trade['data']['status'];
    className?: string;
}

const getData = (status: Trade['data']['status']) => {
    switch (status) {
        case 'LOGIN_REQUEST':
        case 'APPROVAL_PENDING':
        case 'SUBMITTED':
        case 'LOADING':
        case 'SENDING':
        case 'CONVERTING':
        case 'CONFIRMING':
            return {
                icon: 'CLOCK',
                color: colors.NEUE_TYPE_ORANGE,
                statusMessageId: 'TR_BUY_STATUS_PENDING',
            } as const;
        case 'BLOCKED':
        case 'ERROR':
            return {
                icon: 'CROSS',
                color: colors.NEUE_TYPE_RED,
                statusMessageId: 'TR_BUY_STATUS_ERROR',
            } as const;
        case 'SUCCESS':
            return {
                icon: 'CHECK',
                color: colors.NEUE_TYPE_GREEN,
                statusMessageId: 'TR_BUY_STATUS_SUCCESS',
            } as const;
        default:
            return {
                icon: 'CLOCK',
                color: colors.NEUE_TYPE_ORANGE,
                statusMessageId: 'TR_BUY_STATUS_PENDING',
            } as const;
    }
};

const Status = ({ status, className }: Props) => {
    const data = getData(status);
    return (
        <Wrapper color={data.color} className={className}>
            <StyledIcon color={data.color} size={10} icon={data.icon} />
            <Translation id={data.statusMessageId} />
        </Wrapper>
    );
};

const Wrapper = styled.div<{ color: string }>`
    display: flex;
    color: ${props => props.color};
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const StyledIcon = styled(Icon)`
    margin-right: 3px;
`;

export default Status;
