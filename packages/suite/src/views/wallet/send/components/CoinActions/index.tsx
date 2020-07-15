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
    padding: 32px 42px;
`;

const Line = styled.div`
    width: 100%;
    height: 1px;
    border-top: 1px solid ${colors.NEUE_BG_GRAY};
`;

const Box = styled.div`
    display: flex;
    flex: 1;
    justify-content: space-between;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-end;
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
                {networkType === 'bitcoin' && (
                    <Box>
                        <Left />
                        <Right>
                            <AddRecipient />
                        </Right>
                    </Box>
                )}
            </Content>
        </Wrapper>
    );
};
