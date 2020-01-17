import React from 'react';
import styled from 'styled-components';
import { Props } from './Container';
import Fee from '../Fee';
import Layout from '../Layout';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
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
                right={null}
            />
        </Wrapper>
    );
};

export default NetworkTypeBitcoin;
