import React from 'react';
import styled from 'styled-components';
import { Props } from './Container';
import Fee from '../Fee';
import Layout from '../Layout';

import ReplaceByFee from './components/ReplaceByFee';
import Locktime from './components/Locktime';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Row = styled.div`
    display: flex;
    margin-bottom: 30px;

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
                    <Fee
                        symbol={account.symbol}
                        onChange={sendFormActions.handleFeeValueChange}
                        networkType={account.networkType}
                        maxFee={send.feeInfo.maxFee}
                        selectedFee={send.selectedFee}
                        minFee={send.feeInfo.minFee}
                        feeLevels={send.feeInfo.levels}
                        errors={send.customFee.error}
                        customFee={send.customFee.value}
                        sendFormActions={sendFormActions}
                    />
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
            />
        </Wrapper>
    );
};

export default NetworkTypeBitcoin;
