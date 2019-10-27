import React from 'react';
import styled from 'styled-components';
import { PinInput } from '@suite-components';

const Wrapper = styled.div`
    max-width: 240px;
    margin-left: auto;
    margin-right: auto;
`;
interface Props {
    onPinSubmit: (pin: string) => void;
}

// Onboarding Pin wrapper. does not do anything different from common logic, but why not have it.
const PinMatrix = (props: Props) => {
    const { onPinSubmit } = props;
    return (
        <Wrapper>
            <PinInput onPinSubmit={onPinSubmit} />
        </Wrapper>
    );
};

export default PinMatrix;
