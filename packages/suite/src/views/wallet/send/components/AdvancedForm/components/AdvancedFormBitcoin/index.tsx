import React from 'react';
import styled from 'styled-components';

import EstimatedMiningTime from '../../../EstimatedMiningTime';
import Fee from '../Fee/Container';
import Layout from '../Layout';
// import TransactionInfo from '../TransactionInfo/Container';
import Locktime from './components/Locktime';
import ReplaceByFee from './components/ReplaceByFee';
import { Props } from './Container';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Row = styled.div`
    display: flex;
    margin-bottom: 35px;

    &:last-child {
        margin-bottom: 0;
    }
`;

export default ({ send }: Props) => {
    const { customFee } = send;

    return (
        <Wrapper>
            <Layout
                left={
                    <>
                        <Row>
                            <Fee />
                        </Row>
                        {!customFee.value && (
                            <Row>
                                <EstimatedMiningTime
                                    seconds={send.feeInfo.blockTime * send.selectedFee.blocks * 60}
                                />
                            </Row>
                        )}
                    </>
                }
                right={
                    <>
                        <Row>
                            <ReplaceByFee />
                        </Row>
                        <Row>
                            <Locktime />
                        </Row>
                    </>
                }
                // bottom={transactionInfo?.type === 'final' ? <TransactionInfo /> : null}
                bottom={null}
            />
        </Wrapper>
    );
};
