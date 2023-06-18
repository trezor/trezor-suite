import React from 'react';
import styled from 'styled-components';
import { useActions, useDevice } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import * as routerActions from 'src/actions/suite/routerActions';
import { Button, variables } from '@trezor/components';
import { useCoinmarketP2pOffersContext } from 'src/hooks/wallet/useCoinmarketP2pOffers';
import * as receiveActions from 'src/actions/wallet/receiveActions';
import { getUnusedAddressFromAccount } from 'src/utils/wallet/coinmarket/coinmarketUtils';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 10px;
`;

const CardContent = styled.div`
    display: flex;
    flex-direction: column;
    padding: 16px 24px 0 24px;
`;

const Row = styled.div`
    margin-bottom: 20px;
`;

const LabelText = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const Value = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 6px;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Address = styled.div`
    position: relative;
    cursor: default;
    pointer-events: none;
`;

const Overlay = styled.div`
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    position: absolute;
    background-image: linear-gradient(
        to right,
        rgba(0, 0, 0, 0) 0%,
        ${props => props.theme.BG_WHITE} 120px
    );
`;

const HowToText = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
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

export const ReceivingAddressStep = () => {
    const { isLocked } = useDevice();
    const { providers, account, selectedQuote, callInProgress, goToProvider, providerVisited } =
        useCoinmarketP2pOffersContext();
    const { address: unusedAddress, path } = getUnusedAddressFromAccount(account);

    const { goto, showAddress } = useActions({
        goto: routerActions.goto,
        showAddress: receiveActions.showAddress,
    });

    if (!providers || !selectedQuote || !unusedAddress) {
        return null;
    }

    const providerName = providers[selectedQuote.provider].companyName;

    return (
        <Wrapper>
            <CardContent>
                <Row>
                    <LabelText>
                        <Translation id="TR_P2P_RECEIVING_ADDRESS" />
                    </LabelText>
                    <Value>
                        <Address>
                            {unusedAddress.substring(0, 20)}
                            <Overlay />
                        </Address>
                        <StyledButton
                            variant="tertiary"
                            icon="TREZOR_LOGO"
                            isDisabled={isLocked()}
                            isLoading={isLocked()}
                            onClick={() => showAddress(path, unusedAddress)}
                        >
                            <Translation id="TR_P2P_REVEAL_ADDRESS" />
                        </StyledButton>
                    </Value>
                </Row>
                <HowToText>
                    <Translation
                        id="TR_P2P_RECEIVING_ADDRESS_ALMOST_THERE"
                        values={{ providerName }}
                    />
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
                    <StyledButton
                        onClick={() => goto('wallet-coinmarket-p2p', { preserveParams: true })}
                    >
                        <Translation id="TR_P2P_BACK_TO_ACCOUNT" />
                    </StyledButton>
                )}
            </ButtonWrapper>
        </Wrapper>
    );
};
