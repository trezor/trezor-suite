import styled from 'styled-components';
import { WelcomeLayout } from 'src/components/suite';
import { StartContent } from './StartContent';

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

export const SuiteStart = () => (
    <WelcomeLayout>
        <Content data-test="@onboarding/welcome">
            <StartContent />
        </Content>
    </WelcomeLayout>
);
