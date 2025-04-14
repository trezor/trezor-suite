import styled from 'styled-components';

import { StartContent } from './StartContent';
import { WelcomeLayoutWithoutModalSwitcher } from '../../components/suite/layouts/WelcomeLayout/WelcomeLayoutWithoutModalSwitcher';

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%; /* to fit the DeviceAuthenticity steps  */
`;

export const SuiteStart = () => (
    /**
     * In onboarding we have custom confirm dialogs that rely on the fact,
     * that we do not have the ModalProvider in layout, and therefore it is
     * handled in a custom way in the onboarding.
     *
     * Go to `OnboardingStepBox` search for `ConfirmOnDevice`.
     */
    <WelcomeLayoutWithoutModalSwitcher>
        <Content data-testid="@onboarding/welcome">
            <StartContent />
        </Content>
    </WelcomeLayoutWithoutModalSwitcher>
);
