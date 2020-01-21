import React from 'react';
import styled from 'styled-components';

import Fee from '../Fee/Container';
import Layout from '../Layout';
import TransactionInfo from '../TransactionInfo/Container';
import DestinationTag from './components/DestinationTag/Container';
import { Props } from './Container';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const AdvancedFormRipple = ({ send, account }: Props) => {
    if (!send || !account) return null;

    return (
        <Wrapper>
            <Layout left={<Fee />} right={<DestinationTag />} middle={<TransactionInfo />} />
        </Wrapper>
    );
};

export default AdvancedFormRipple;
