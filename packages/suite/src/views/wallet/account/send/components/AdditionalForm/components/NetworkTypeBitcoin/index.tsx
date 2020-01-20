import React from 'react';
import styled from 'styled-components';

import EstimatedMiningTime from '../../../EstimatedMiningTime';
import Fee from '../Fee';
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

const Row = styled.div`
    display: flex;
    margin-bottom: 25px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const Inputs = styled.div``;
const Item = styled.div``;

const NetworkTypeBitcoin = ({ send, sendFormActions, selectedAccount, settings, fiat }: Props) => {
    if (!send) return null;
    const { transactionInfo } = send.networkTypeBitcoin;
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
                                fiat={fiat}
                                localCurrency={settings.localCurrency}
                                feeLevels={send.feeInfo.levels}
                                errors={send.customFee.error}
                                customFee={send.customFee.value}
                                sendFormActions={sendFormActions}
                            />
                        </Row>
                        <Row>
                            <EstimatedMiningTime
                                seconds={send.feeInfo.blockTime * send.selectedFee.blocks * 60}
                            />
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
                bottom={transactionInfo?.type === 'final' ? <TransactionInfo /> : null}
            />
        </Wrapper>
    );
};

export default NetworkTypeBitcoin;
