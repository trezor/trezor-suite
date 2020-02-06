import React from 'react';
import styled from 'styled-components';
import DestinationTag from './components/DestinationTag';
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

const NetworkTypeXrp = ({ send, sendFormActions, sendFormActionsRipple }: Props) => {
    if (!send) return null;
    return (
        <Wrapper>
            <Row>
                <CustomFee
                    maxFee={send.feeInfo.maxFee}
                    minFee={send.feeInfo.minFee}
                    sendFormActions={sendFormActions}
                    customFee={send.customFee.value}
                    errors={send.customFee.error}
                />
            </Row>
            <Row>
                <DestinationTag
                    sendFormActionsRipple={sendFormActionsRipple}
                    destinationTag={send.networkTypeRipple.destinationTag.value}
                    errors={send.networkTypeRipple.destinationTag.error}
                />
            </Row>
        </Wrapper>
    );
};

export default NetworkTypeXrp;
