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
    margin-bottom: 25px;
`;

export default ({ send, account }: Props) => {
    if (!send || !account) return null;
    const { transactionInfo } = send.networkTypeEthereum;

    return (
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
                bottom={transactionInfo?.type === 'final' ? <TransactionInfo /> : null}
            />
        </Wrapper>
    );
};
