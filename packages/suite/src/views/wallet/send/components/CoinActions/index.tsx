import { colors } from '@trezor/components';
import { useSendFormContext } from '@wallet-hooks';
import React from 'react';
import styled from 'styled-components';

import AddData from './components/AddData';
import AddDestinationTag from './components/AddDestinationTag';
import BitcoinActions from './components/BitcoinActions';

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
                {networkType === 'bitcoin' && <BitcoinActions />}
            </Content>
        </Wrapper>
    );
};
