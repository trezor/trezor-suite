import React from 'react';
import styled from 'styled-components';
import DestinationTag from './components/DestinationTag';
import { Props } from './Container';
import CustomFee from '../CustomFee';
import Layout from '../Layout';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const NetworkTypeXrp = ({ send, sendFormActions, sendFormActionsRipple }: Props) => {
    if (!send) return null;
    return (
        <Wrapper>
            <Layout
                left={
                    <CustomFee
                        maxFee={send.feeInfo.maxFee}
                        minFee={send.feeInfo.minFee}
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
