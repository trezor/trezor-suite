import React from 'react';
import styled from 'styled-components';

import Fee from '../Fee/Container';
import Layout from '../Layout';
import DestinationTag from './components/DestinationTag/Container';
import { Props } from './Container';

// import TransactionInfo from '../TransactionInfo/Container';
const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

export default ({ send, account }: Props) => {
    if (!account) return null;
    // const { transactionInfo } = send.networkTypeRipple;

    return (
        <Wrapper>
            <Layout
                left={<Fee />}
                right={<DestinationTag />}
                bottom={null}
                // bottom={transactionInfo?.type === 'final' ? <TransactionInfo /> : null}
            />
        </Wrapper>
    );
};
