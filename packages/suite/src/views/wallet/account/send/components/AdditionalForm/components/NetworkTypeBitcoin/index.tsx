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

const NetworkTypeBitcoin = ({ send, sendFormActions }: Props) => {
    if (!send) return null;
    return (
        <Wrapper>
            <Layout
                left={
                    <Fee
                        maxFee={send.feeInfo.maxFee}
                        minFee={send.feeInfo.minFee}
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
