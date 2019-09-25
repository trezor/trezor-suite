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

const NetworkTypeXrp = (props: Props) => (
    <Wrapper>
        <Row>
            <CustomFee
                sendFormActions={props.sendFormActions}
                customFee={props.send.customFee.value}
                errors={props.send.customFee.error}
            />
        </Row>
        <Row>
            <DestinationTag
                sendFormActionsRipple={props.sendFormActionsRipple}
                destinationTag={props.send.networkTypeRipple.destinationTag.value}
                errors={props.send.networkTypeRipple.destinationTag.error}
            />
        </Row>
    </Wrapper>
);

export default NetworkTypeXrp;
