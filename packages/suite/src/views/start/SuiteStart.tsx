import styled from 'styled-components';
import { WelcomeLayout } from 'src/components/suite';
import { StartContent } from './StartContent';

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%; /* to fit the DeviceAuthenticity steps  */
`;

export const SuiteStart = () => (
    <WelcomeLayout>
        <Content data-test="@onboarding/welcome">
            <StartContent />
        </Content>
    </WelcomeLayout>
);
