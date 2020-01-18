import React from 'react';
import styled from 'styled-components';
import { Props } from './Container';
import Fee from '../Fee';
import Layout from '../Layout';
import SwitchItem from './components/SwitchItem';

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
                            <SwitchItem
                                title="Replace by fee (RBF)"
                                description="RBF allows to bump fee later in case you want the transaction to be mined faster"
                            />
                        </Row>
                        <Row>
                            <SwitchItem
                                title="Add Locktime"
                                description="Allows you to postpone the transaction by set value (time or block)"
                            />
                        </Row>
                    </>
                }
            />
        </Wrapper>
    );
};

export default NetworkTypeBitcoin;
