import styled from 'styled-components';

import { ViewOnlyPromoContent } from './ViewOnlyPromoContent';
import { WelcomeLayout } from '../../components/suite/layouts/WelcomeLayout/WelcomeLayout';

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%; /* to fit the DeviceAuthenticity steps  */
`;

export const ViewOnlyPromo = () => (
    <WelcomeLayout>
        <Content data-testid="@onboarding/view-only-promo">
            <ViewOnlyPromoContent />
        </Content>
    </WelcomeLayout>
);
