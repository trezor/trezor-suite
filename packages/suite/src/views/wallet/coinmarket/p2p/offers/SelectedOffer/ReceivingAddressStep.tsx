import React from 'react';
import styled from 'styled-components';
import { useActions, useDevice } from '@suite-hooks';
import { Translation } from '@suite-components';
import * as routerActions from '@suite-actions/routerActions';
import { Button, variables } from '@trezor/components';
import { useCoinmarketP2pOffersContext } from '@wallet-hooks/useCoinmarketP2pOffers';
import * as receiveActions from '@wallet-actions/receiveActions';
import { getUnusedAddressFromAccount } from '@wallet-utils/coinmarket/coinmarketUtils';

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
    inset: 0;
    position: absolute;
    background-image: linear-gradient(
        to right,
        rgb(0 0 0 / 0%) 0%,
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
