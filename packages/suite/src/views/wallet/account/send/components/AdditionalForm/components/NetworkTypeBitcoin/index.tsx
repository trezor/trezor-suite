import React from 'react';
import styled from 'styled-components';

import EstimatedMiningTime from '../../../EstimatedMiningTime';
import Fee from '../Fee';
import Footer from '../Footer';
import Layout from '../Layout';
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
    margin-bottom: 25px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const NetworkTypeBitcoin = ({ send, sendFormActions, selectedAccount }: Props) => {
    if (!send) return null;
    const { account } = selectedAccount;
    return (
        <Wrapper>
            <Layout
                left={
                    <>
                        <Row>
                            <Fee
                                symbol={account.symbol}
                                networkType={account.networkType}
                                maxFee={send.feeInfo.maxFee}
                                selectedFee={send.selectedFee}
                                minFee={send.feeInfo.minFee}
                                feeLevels={send.feeInfo.levels}
                                errors={send.customFee.error}
                                customFee={send.customFee.value}
                                sendFormActions={sendFormActions}
                            />
                        </Row>
                        <Row>
                            <EstimatedMiningTime seconds={130} />
                        </Row>
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
                bottom={
                    <Footer
                        rows={[
                            { title: 'Fee', value: 'bbb' },
                            { title: 'Size', value: 'aaa' },
                            { title: 'Inputs', value: 'bbb' },
                            { title: 'Outputs', value: 'aaa' },
                        ]}
                    />
                }
            />
        </Wrapper>
    );
};

export default NetworkTypeBitcoin;
