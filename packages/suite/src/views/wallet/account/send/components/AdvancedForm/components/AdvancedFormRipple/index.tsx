import React from 'react';
import styled from 'styled-components';

import Fee from '../Fee/Container';
import Layout from '../Layout';
import TransactionInfo from '../TransactionInfo/Container';
import DestinationTag from './components/DestinationTag';
import { Props } from './Container';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const AdvancedFormRipple = ({ send, sendFormActionsRipple, selectedAccount }: Props) => {
    const { account } = selectedAccount;
    if (!send || !account) return null;
    const { transactionInfo } = send.networkTypeRipple;

    return (
        <Wrapper>
            <Layout
                left={<Fee />}
                right={
                    <DestinationTag
                        sendFormActionsRipple={sendFormActionsRipple}
                        destinationTag={send.networkTypeRipple.destinationTag.value}
                        errors={send.networkTypeRipple.destinationTag.error}
                    />
                }
                bottom={transactionInfo && <TransactionInfo />}
            />
        </Wrapper>
    );
};

export default AdvancedFormRipple;
