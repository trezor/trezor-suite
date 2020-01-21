import React from 'react';
import styled from 'styled-components';

import Fee from '../Fee/Container';
import Layout from '../Layout';
import TransactionInfo from '../TransactionInfo/Container';
import Data from './components/Data/Container';
import GasLimit from './components/GasLimit/Container';
import GasPrice from './components/GasPrice/Container';
import { Props } from './Container';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
`;

const Row = styled.div`
    margin-bottom: 15px;
`;

const AdvancedFormEthereum = ({ send, account }: Props) => {
    if (!send || !account) return null;

    return (
        <Wrapper>
            <Layout
                left={
                    <>
                        <Row>
                            <Fee />
                        </Row>
                        <Row>
                            <GasLimit />
                        </Row>
                        <Row>
                            <GasPrice />
                        </Row>
                    </>
                }
                right={null}
                middle={<Data />}
                bottom={<TransactionInfo />}
            />
        </Wrapper>
    );
};

export default AdvancedFormEthereum;
