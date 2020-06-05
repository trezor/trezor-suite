import React from 'react';
import styled from 'styled-components';

import Fee from '../Fee';
import Layout from '../Layout';
import Data from './components/Data/Container';
import GasLimit from './components/GasLimit/Container';
import GasPrice from './components/GasPrice/Container';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
`;

const Row = styled.div`
    margin-bottom: 25px;
`;

export default () => (
    <Wrapper>
        <Layout
            left={
                <Row>
                    <Fee />
                </Row>
            }
            right={
                <>
                    <Row>
                        <GasLimit />
                    </Row>
                    <Row>
                        <GasPrice />
                    </Row>
                </>
            }
            middle={<Data />}
            bottom={null}
        />
    </Wrapper>
);
