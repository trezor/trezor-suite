import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { Button, variables } from '@trezor/components';
import { useCoinmarketP2pOffersContext } from 'src/hooks/wallet/useCoinmarketP2pOffers';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 10px;
`;

const CardContent = styled.div`
    display: flex;
    flex-direction: column;
    padding: 16px 24px 0;
`;

const HowToText = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
`;

const HowToList = styled.ol`
    margin: 10px 20px 0;
`;

const HowToItem = styled.li`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
    padding: 0 10px 8px;
`;

const ButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 20px;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    margin: 20px 0;
`;

const StyledButton = styled(Button)`
    margin: 0 10px;
`;

export const GetStartedStep = () => {
    const {
        providers,
        selectedQuote,
        goToProvider,
        callInProgress,
        providerVisited,
        goToReceivingAddress,
    } = useCoinmarketP2pOffersContext();

    if (!providers || !selectedQuote) {
        return null;
    }

    const providerName = providers[selectedQuote.provider].companyName;

    return (
        <Wrapper>
            <CardContent>
                <HowToText>
                    <Translation id="TR_P2P_GET_STARTED_INTRO" values={{ providerName }} />
                </HowToText>
                <HowToList>
                    <HowToItem>
                        <Translation id="TR_P2P_GET_STARTED_ITEM_1" values={{ providerName }} />
                    </HowToItem>
                    <HowToItem>
                        <Translation id="TR_P2P_GET_STARTED_ITEM_2" />
                    </HowToItem>
                    <HowToItem>
                        <Translation id="TR_P2P_GET_STARTED_ITEM_3" values={{ providerName }} />
                    </HowToItem>
                </HowToList>
                <HowToText>
                    <Translation id="TR_P2P_GET_STARTED_ATTENTION" />
                </HowToText>
            </CardContent>
            <ButtonWrapper>
                <StyledButton
                    variant={!providerVisited ? 'primary' : 'secondary'}
                    isDisabled={callInProgress}
                    isLoading={callInProgress}
                    onClick={e => {
                        goToProvider();
                        e.currentTarget.blur(); // ensures button background color is correct
                    }}
                >
                    <Translation id="TR_P2P_GO_TO_PROVIDER" values={{ providerName }} />
                </StyledButton>
                {providerVisited && (
                    <StyledButton onClick={() => goToReceivingAddress()}>
                        <Translation id="TR_P2P_GO_TO_RECEIVING_ADDRESS" />
                    </StyledButton>
                )}
            </ButtonWrapper>
        </Wrapper>
    );
};
