import React from 'react';
import styled from 'styled-components';

import Fee from '../Fee';
import Layout from '../LayoutCommon';
import Data from './components/Data';
import GasLimit from './components/GasLimit';
import GasPrice from './components/GasPrice';

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
