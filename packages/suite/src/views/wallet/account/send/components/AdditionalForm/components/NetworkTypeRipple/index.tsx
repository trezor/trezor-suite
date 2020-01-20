import React from 'react';
import styled from 'styled-components';
import DestinationTag from './components/DestinationTag';
import { Props } from './Container';
import Fee from '../Fee';
import Layout from '../Layout';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const NetworkTypeXrp = ({ send, sendFormActionsRipple, selectedAccount }: Props) => {
    const { account } = selectedAccount;
    if (!send || !account) return null;

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
                        customFee={send.customFee.value}
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
            />
        </Wrapper>
    );
};

export default NetworkTypeXrp;
