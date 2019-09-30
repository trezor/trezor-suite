import React from 'react';
import styled from 'styled-components';
import { Props } from './Container';
import CustomFee from '../CustomFee';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Row = styled.div`
    padding: 0 0 30px 0;
    display: flex;

    &:last-child {
        padding: 0;
    }
`;

const NetworkTypeBitcoin = ({ send, sendFormActions }: Props) => {
    if (!send) return null;
    return (
        <Wrapper>
            <Row>
                <CustomFee
                    maxFee={send.feeInfo.maxFee}
                    minFee={send.feeInfo.minFee}
                    errors={send.customFee.error}
                    customFee={send.customFee.value}
                    sendFormActions={sendFormActions}
                />
            </Row>
        </Wrapper>
    );
};

export default NetworkTypeBitcoin;
