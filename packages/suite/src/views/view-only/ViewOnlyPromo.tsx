import styled from 'styled-components';

import { WelcomeLayout } from 'src/components/suite';

import { ViewOnlyPromoContent } from './ViewOnlyPromoContent';

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%; /* to fit the DeviceAuthenticity steps  */
`;

export const ViewOnlyPromo = () => {
    return (
        <WelcomeLayout>
            <Content data-testid="@onboarding/view-only-promo">
                <ViewOnlyPromoContent />
            </Content>
        </WelcomeLayout>
    );
};
