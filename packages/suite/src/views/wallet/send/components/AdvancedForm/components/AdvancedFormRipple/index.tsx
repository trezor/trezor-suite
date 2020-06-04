import React from 'react';
import styled from 'styled-components';

import Fee from '../Fee/Container';
import Layout from '../Layout';
import DestinationTag from './components/DestinationTag';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

export default () => (
    <Wrapper>
        <Layout left={<Fee />} right={<DestinationTag />} bottom={null} />
    </Wrapper>
);
