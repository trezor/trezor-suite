import React from 'react';
import styled from 'styled-components';

import EstimatedMiningTime from '../../../EstimatedMiningTime';
import Fee from '../Fee/Container';
import Layout from '../Layout';
import TransactionInfo from '../TransactionInfo/Container';
import Locktime from './components/Locktime';
import ReplaceByFee from './components/ReplaceByFee';
import { Props } from './Container';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Content = styled.div``;

const Row = styled.div`
    display: flex;
    margin-bottom: 25px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const AdvancedFormBitcoin = ({ send }: Props) => {
    if (!send) return null;
    const { customFee } = send;
    const { transactionInfo } = send.networkTypeBitcoin;
    return (
        <Wrapper>
            <Layout
                left={
                    <Content>
                        <Row>
                            <Fee />
                        </Row>
                        {customFee.value && (
                            <Row>
                                <EstimatedMiningTime
                                    seconds={send.feeInfo.blockTime * send.selectedFee.blocks * 60}
                                />
                            </Row>
                        )}
                    </Content>
                }
                right={
                    <Content>
                        <Row>
                            <ReplaceByFee />
                        </Row>
                        <Row>
                            <Locktime />
                        </Row>
                    </Content>
                }
                bottom={transactionInfo && <TransactionInfo />}
            />
        </Wrapper>
    );
};

export default AdvancedFormBitcoin;
