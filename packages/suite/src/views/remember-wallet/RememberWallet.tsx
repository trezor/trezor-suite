import styled from 'styled-components';
import { RememberWalletCard } from './RememberWalletCard';

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%; /* to fit the DeviceAuthenticity steps  */
`;

export const RememberWallet = () => (
    <Content data-test="@onboarding/remember-wallet">
        <RememberWalletCard />
    </Content>
);
