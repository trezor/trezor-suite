import React from 'react';
import styled from 'styled-components';

import TransactionInfo from '../TransactionInfo/Container';
import Fee from '../Fee';
import Layout from '../Layout';
import DestinationTag from './components/DestinationTag';
import { Props } from './Container';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const NetworkTypeXrp = ({
    send,
    sendFormActionsRipple,
    sendFormActions,
    selectedAccount,
}: Props) => {
    const { account } = selectedAccount;
    if (!send || !account) return null;
    const { transactionInfo } = send.networkTypeRipple;

    return (
        <Wrapper>
            <Layout
                left={
                    <Fee
                        maxFee={send.feeInfo.maxFee}
                        networkType={account.networkType}
                        minFee={send.feeInfo.minFee}
                        selectedFee={send.selectedFee}
                        symbol={account.symbol}
                        feeLevels={send.feeInfo.levels}
                        sendFormActions={sendFormActions}
                        customFee={send.customFee.value || ''}
                        errors={send.customFee.error}
                    />
                }
                right={
                    <DestinationTag
                        sendFormActionsRipple={sendFormActionsRipple}
                        destinationTag={send.networkTypeRipple.destinationTag.value}
                        errors={send.networkTypeRipple.destinationTag.error}
                    />
                }
                bottom={transactionInfo?.type !== 'error' ? <TransactionInfo /> : null}
            />
        </Wrapper>
    );
};

export default NetworkTypeXrp;
