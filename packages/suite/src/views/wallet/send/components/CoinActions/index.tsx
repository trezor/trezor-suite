import { colors } from '@trezor/components';
import { useSendFormContext } from '@wallet-hooks';
import React from 'react';
import styled from 'styled-components';

import AddData from './components/AddData';
import AddDestinationTag from './components/AddDestinationTag';
import AddRecipient from './components/AddRecipient';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

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
                {networkType === 'ripple' && <AddDestinationTag />}
                {networkType === 'ethereum' && <AddData />}
                {networkType === 'bitcoin' && <AddRecipient />}
            </Content>
        </Wrapper>
    );
};
