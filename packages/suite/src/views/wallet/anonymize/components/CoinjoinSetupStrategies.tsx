import React, { useState } from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';

import { COINJOIN_STRATEGIES } from '@suite/services/coinjoin/config';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { TooltipSymbol, Translation } from '@suite-components';
import { useActions, useSelector } from '@suite-hooks';
import { Card, Checkbox, Link, TooltipButton, variables } from '@trezor/components';
import { ZKSNACKS_TERMS_URL } from '@trezor/urls';
import { startCoinjoinSession } from '@wallet-actions/coinjoinAccountActions';
import { CryptoAmountWithHeader } from '@wallet-components/PrivacyAccount/CryptoAmountWithHeader';
import {
    selectCurrentCoinjoinBalanceBreakdown,
    selectCurrentTargetAnonymity,
} from '@wallet-reducers/coinjoinReducer';
import { CoinjoinCustomStrategy } from './CoinjoinCustomStrategy';
import { CoinjoinDefaultStrategy, CoinJoinStrategy } from './CoinjoinDefaultStrategy';

const StyledCard = styled(Card)`
    margin-bottom: 8px;
`;

const Row = styled.div`
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
    display: flex;
    gap: 50px;
    margin: 20px 0;
    padding-bottom: 30px;
`;

const StyledCryptoAmountWithHeader = styled(CryptoAmountWithHeader)`
    flex-basis: 50%;
`;

const Heading = styled.div`
    font-size: ${variables.FONT_SIZE.H3};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const ConfirmationsHeading = styled(Heading)`
    margin-bottom: 4px;
`;

const AmountHeading = styled.div`
    color: ${({ theme }) => theme.TYPE_GREEN};
`;

const CheckboxWrapper = styled.div`
    align-items: center;
    display: flex;
    margin: 16px 0;
`;

const StyledCheckbox = styled(Checkbox)`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledLink = styled(Link)`
    text-decoration: underline;
`;

const StyledTooltipButton = styled(TooltipButton)`
    margin: 24px auto 0 auto;

    :disabled {
        background: ${({ theme }) => theme.STROKE_GREY};
    }
`;

interface CoinjoinSetupStrategiesProps {
    selectedAccount: SelectedAccountLoaded;
}

export const CoinjoinSetupStrategies = ({ selectedAccount }: CoinjoinSetupStrategiesProps) => {
    const [strategy, setStrategy] = useState<CoinJoinStrategy>('recommended');
    const [customMaxFee, setCustomMaxFee] = useState(3);
    const [customSkipRounds, setCustomSkipRounds] = useState(true);
    const [connectedConfirmed, setConnectedConfirmed] = useState(false);
    const [termsConfirmed, setTermsConfirmed] = useState(false);

    const actions = useActions({
        startCoinjoinSession,
    });
    const coordinatorData = useSelector(
        state => state.wallet.coinjoin.clients[selectedAccount.network.symbol],
    );
    const targetAnonymity = useSelector(selectCurrentTargetAnonymity);
    const { notAnonymized } = useSelector(selectCurrentCoinjoinBalanceBreakdown);

    if (!coordinatorData || targetAnonymity == null) {
        return null;
    }

    const isCustom = strategy === 'custom';
    const allChecked = connectedConfirmed && termsConfirmed;
    const fee = new BigNumber(notAnonymized).times(coordinatorData.coordinatorFeeRate).toString();

    const reset = () => setStrategy('recommended');
    const toggleConnectConfirmation = () => setConnectedConfirmed(current => !current);
    const toggleTermsConfirmation = () => setTermsConfirmed(current => !current);
    const anonymize = () =>
        actions.startCoinjoinSession(selectedAccount.account, {
            maxCoordinatorFeeRate:
                coordinatorData.coordinatorFeeRate * 100 * 10 ** selectedAccount.network.decimals, // fee rate to percent to satoshis
            maxFeePerKvbyte:
                (isCustom ? customMaxFee : coordinatorData.feeRatesMedians[strategy]) * 1000, // transform to kvB
            maxRounds: COINJOIN_STRATEGIES[strategy].maxRounds,
            skipRounds:
                COINJOIN_STRATEGIES[
                    (isCustom && customSkipRounds) || strategy === 'fast' ? 'fast' : 'recommended'
                ].skipRounds || undefined,
            targetAnonymity,
        });

    return (
        <>
            <StyledCard>
                <Heading>
                    <Translation id="TR_START_ANONYMISATION" />
                </Heading>
                <Row>
                    <StyledCryptoAmountWithHeader
                        header={
                            <AmountHeading>
                                <Translation id="TR_AMOUNT" />
                            </AmountHeading>
                        }
                        value={notAnonymized}
                        symbol={selectedAccount.network.symbol}
                    />
                    <StyledCryptoAmountWithHeader
                        header={
                            <AmountHeading>
                                <Translation id="TR_SERVICE_FEE" />
                            </AmountHeading>
                        }
                        value={fee}
                        symbol={selectedAccount.network.symbol}
                        note={<Translation id="TR_SERVICE_FEE_NOTE" />}
                    />
                </Row>
                {isCustom ? (
                    <CoinjoinCustomStrategy
                        maxFee={customMaxFee}
                        skipRounds={customSkipRounds}
                        setMaxFee={setCustomMaxFee}
                        setSkipRounds={setCustomSkipRounds}
                        reset={reset}
                    />
                ) : (
                    <CoinjoinDefaultStrategy
                        feeRatesMedians={coordinatorData.feeRatesMedians}
                        strategy={strategy}
                        setStrategy={setStrategy}
                    />
                )}
            </StyledCard>

            <StyledCard>
                <ConfirmationsHeading>
                    <Translation id="TR_CONFIRMATIONS" />
                </ConfirmationsHeading>
                <CheckboxWrapper>
                    <StyledCheckbox
                        isChecked={connectedConfirmed}
                        onClick={toggleConnectConfirmation}
                    >
                        <Translation id="TR_DEVICE_CONNECTED_CONFIRMATION" />
                    </StyledCheckbox>
                    <TooltipSymbol content={<Translation id="TR_DEVICE_CONNECTED_TOOLTIP" />} />
                </CheckboxWrapper>
                <StyledCheckbox isChecked={termsConfirmed} onClick={toggleTermsConfirmation}>
                    <Translation
                        id="TR_TERMS_AND_PRIVACY_CONFIRMATION"
                        values={{
                            coordinator: chunks => (
                                <StyledLink href={ZKSNACKS_TERMS_URL}>{chunks}</StyledLink>
                            ),
                            trezor: chunks => (
                                <StyledLink href="https://trezor.io">{chunks}</StyledLink>
                            ), // TODO: replace URL
                        }}
                    />
                </StyledCheckbox>
            </StyledCard>

            <StyledTooltipButton
                onClick={anonymize}
                isDisabled={!allChecked}
                tooltipContent={
                    !allChecked && <Translation id="TR_ANONYMISATION_BUTTON_DISABLED" />
                }
            >
                <Translation id="TR_ANONYMIZE" />
            </StyledTooltipButton>
        </>
    );
};
