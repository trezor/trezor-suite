import styled from 'styled-components';

import { variables } from '@trezor/components';

import { MAX_WIDTH } from 'src/constants/suite/layout';
import PreOnboardingSetup from './components/PreOnboardingSetup';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 20vh;
    max-width: ${MAX_WIDTH};
    width: 100%;

    @media all and (max-height: ${variables.SCREEN_SIZE.MD}) {
        margin-top: 5vh;
    }
    @media all and (max-height: ${variables.SCREEN_SIZE.SM}) {
        margin-top: 0vh;
    }
`;

const WelcomeStep = () => (
    <Wrapper data-test="@onboarding/welcome">
        <PreOnboardingSetup />
    </Wrapper>
);

export default WelcomeStep;
