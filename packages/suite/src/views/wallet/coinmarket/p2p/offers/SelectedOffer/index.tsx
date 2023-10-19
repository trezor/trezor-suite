import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { Card, Icon, colors, variables } from '@trezor/components';
import { useCoinmarketP2pOffersContext } from 'src/hooks/wallet/useCoinmarketP2pOffers';
import { P2pStep } from 'src/types/wallet/coinmarketP2pOffers';
import { GetStartedStep } from './GetStartedStep';
import { ReceivingAddressStep } from './ReceivingAddressStep';
import { OfferDetails } from './OfferDetails';

const Wrapper = styled.div`
    display: flex;
    margin-top: 20px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex-direction: column;
    }
`;

const StyledCard = styled(Card)`
    flex: 1;
    padding: 0;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 25px;
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
`;

interface StepProps {
    active: boolean;
}

const Step = styled.div<StepProps>`
    font-weight: ${({ active }) =>
        active ? variables.FONT_WEIGHT.DEMI_BOLD : variables.FONT_WEIGHT.MEDIUM};
    color: ${({ active, theme }) => (active ? theme.TYPE_GREEN : theme.TYPE_LIGHT_GREY)};
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    flex: 1;
    justify-content: center;
`;

const Separator = styled.div`
    display: flex;
    height: 48px;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.STROKE_GREY};
`;

export const SelectedOffer = () => {
    const { account, providers, quotesRequest, selectedQuote, p2pStep } =
        useCoinmarketP2pOffersContext();

    if (!quotesRequest || !selectedQuote) {
        return null;
    }

    return (
        <Wrapper>
            <StyledCard>
                <Header>
                    <Step active={p2pStep === P2pStep.GET_STARTED}>
                        <Translation id="TR_P2P_GET_STARTED_STEP" />
                    </Step>
                    <Separator>
                        <Icon icon="ARROW_RIGHT" color={colors.TYPE_LIGHT_GREY} />
                    </Separator>
                    <Step active={p2pStep === P2pStep.RECEIVING_ADDRESS}>
                        <Translation id="TR_P2P_RECEIVING_ADDRESS_STEP" />
                    </Step>
                </Header>
                {p2pStep === P2pStep.GET_STARTED && <GetStartedStep />}
                {p2pStep === P2pStep.RECEIVING_ADDRESS && <ReceivingAddressStep />}
            </StyledCard>
            <OfferDetails
                account={account}
                providers={providers}
                quotesRequest={quotesRequest}
                selectedQuote={selectedQuote}
            />
        </Wrapper>
    );
};
