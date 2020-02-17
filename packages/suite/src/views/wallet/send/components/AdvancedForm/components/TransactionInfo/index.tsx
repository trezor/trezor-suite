import React from 'react';
import styled from 'styled-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { colors } from '@trezor/components-v2';
import { Props } from './Container';
import { getTransactionInfo } from '@wallet-utils/sendFormUtils';

const Wrapper = styled.div``;

const Item = styled.div`
    display: flex;
    color: ${colors.BLACK50};
    padding-bottom: 5px;

    &:last-child {
        padding-bottom: 0;
    }
`;

const Title = styled.div``;

const Value = styled.div`
    padding-left: 5px;
`;

export default ({ account, send }: Props) => {
    if (!account || !send) return null;
    const { networkType, symbol } = account;
    const transactionInfo = getTransactionInfo(networkType, send);

    return (
        <Wrapper>
            <Item>
                <Title>Fee:</Title>
                <Value>
                    {formatNetworkAmount(transactionInfo.fee, symbol)} {symbol.toUpperCase()}
                </Value>
            </Item>
            {transactionInfo.bytes && (
                <Item>
                    <Title>Size:</Title>
                    <Value>{transactionInfo.bytes} bytes</Value>
                </Item>
            )}
            <Item>
                <Title>Inputs:</Title>
                <Value>xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx xxx</Value>
            </Item>
            <Item>
                <Title>Outputs:</Title>
                <Value>yyy yyy yyy yyy yyy yyy yyy yyy yyy yyy yyy yyy yyy</Value>
            </Item>
        </Wrapper>
    );
};
