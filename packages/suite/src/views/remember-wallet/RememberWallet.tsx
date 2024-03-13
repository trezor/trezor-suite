import styled from 'styled-components';
import { WelcomeLayout } from 'src/components/suite';
import { RememberWalletCard } from './RememberWalletCard';

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%; /* to fit the DeviceAuthenticity steps  */
`;

export const RememberWallet = () => (
    <WelcomeLayout>
        <Content data-test="@onboarding/remember-wallet">
            <RememberWalletCard />
        </Content>
    </WelcomeLayout>
);
