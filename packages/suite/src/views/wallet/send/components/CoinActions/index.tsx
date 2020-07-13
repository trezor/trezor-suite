import React from 'react';
import styled from 'styled-components';
import AddRecipient from './components/AddRecipient';
import DestinationTag from './components/DestinationTag';
import AddData from './components/AddData';
import { colors } from '@trezor/components';
import { useSendFormContext } from '@wallet-hooks';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Left = styled.div``;

const Right = styled.div``;

const Content = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 32px 42px;
`;

const Line = styled.div`
    width: 100%;
    height: 10px;
    border-top: 1px solid ${colors.NEUE_BG_GRAY};
`;

export default () => {
    const {
        account: { networkType },
    } = useSendFormContext();

    return (
        <Wrapper>
            <Line />
            <Content>
                <Left>
                    {networkType === 'ripple' && <DestinationTag />}
                    {networkType === 'ethereum' && <AddData />}
                </Left>
                <Right>{networkType === 'bitcoin' && <AddRecipient />}</Right>
            </Content>
        </Wrapper>
    );
};
