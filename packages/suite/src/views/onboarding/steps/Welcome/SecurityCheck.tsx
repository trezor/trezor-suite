import React from 'react';
import styled from 'styled-components';
import { Button, variables } from '@trezor/components';
import { useOnboarding } from '@suite-hooks';
import { Translation } from '@suite/components/suite';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

interface Props {
    initialized: boolean;
}

const SecurityCheck = ({ initialized }: Props) => {
    const { goToNextStep, goto } = useOnboarding();
    return (
        <Wrapper>
            SecurityCheck for {initialized ? 'initialized' : 'uninitialized'} device
            {initialized ? (
                <Button data-test="@onboarding/exit-app-button" onClick={() => goto('suite-index')}>
                    <Translation id="TR_GO_TO_SUITE" />
                </Button>
            ) : (
                <Button onClick={() => goToNextStep()}>
                    <Translation id="TR_CONTINUE" />
                </Button>
            )}
            <Button variant="secondary">velky spatny</Button>
        </Wrapper>
    );
};

export default SecurityCheck;
