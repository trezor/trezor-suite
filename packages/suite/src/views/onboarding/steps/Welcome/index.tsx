import styled from 'styled-components';

import { MAX_WIDTH } from 'src/constants/suite/layout';
import PreOnboardingSetup from './components/PreOnboardingSetup';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-width: ${MAX_WIDTH};
    width: 100%;
    margin-bottom: 66px;
`;

const WelcomeStep = () => (
    <Wrapper data-test="@onboarding/welcome">
        <PreOnboardingSetup />
    </Wrapper>
);

export default WelcomeStep;
