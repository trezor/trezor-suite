import React, { useState } from 'react';
import styled from 'styled-components';

import { DEFAULT_MAX_MINING_FEE, RECOMMENDED_SKIP_ROUNDS } from '@suite/services/coinjoin';
import { selectAccountTransactions } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { TooltipSymbol, Translation, TrezorLink } from '@suite-components';
import { Error } from '@suite-components/Error';
import { useActions, useSelector, useDevice } from '@suite-hooks';
import { Card, Checkbox, Link, TooltipButton, variables } from '@trezor/components';
import { DATA_TOS_COINJOIN_URL, ZKSNACKS_TERMS_URL } from '@trezor/urls';
import { startCoinjoinSession } from '@wallet-actions/coinjoinAccountActions';
import { CryptoAmountWithHeader } from '@wallet-components/PrivacyAccount/CryptoAmountWithHeader';

import {
    selectCurrentCoinjoinBalanceBreakdown,
    selectCurrentTargetAnonymity,
    selectIsCoinjoinBlockedByTor,
} from '@wallet-reducers/coinjoinReducer';
import { calculateServiceFee, getMaxRounds } from '@wallet-utils/coinjoinUtils';
import { CoinjoinCustomStrategy } from './CoinjoinCustomStrategy';
import { CoinjoinDefaultStrategy, CoinJoinStrategy } from './CoinjoinDefaultStrategy';
import {
    Feature,
    selectIsFeatureDisabled,
    selectFeatureMessageContent,
} from '@suite-reducers/messageSystemReducer';

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

const StyledTooltipButton = styled(TooltipButton)`
    margin: 24px auto 0 auto;

    :disabled {
        background: ${({ theme }) => theme.STROKE_GREY};
    }
`;

interface CoinjoinSetupStrategiesProps {
    account: Account;
}

export const CoinjoinSetupStrategies = ({ account }: CoinjoinSetupStrategiesProps) => {
    const [strategy, setStrategy] = useState<CoinJoinStrategy>('recommended');
    const [customMaxFee, setCustomMaxFee] = useState(DEFAULT_MAX_MINING_FEE);
    const [customSkipRounds, setCustomSkipRounds] = useState(true);
    const [connectedConfirmed, setConnectedConfirmed] = useState(false);
    const [termsConfirmed, setTermsConfirmed] = useState(false);

    const actions = useActions({
        startCoinjoinSession,
    });
    const coordinatorData = useSelector(state => state.wallet.coinjoin.clients[account.symbol]);
    const targetAnonymity = useSelector(selectCurrentTargetAnonymity);
    const { notAnonymized } = useSelector(selectCurrentCoinjoinBalanceBreakdown);
    const accountTransactions = useSelector(state => selectAccountTransactions(state, account.key));
    const { isLocked } = useDevice();
    const isCoinJoinBlockedByTor = useSelector(selectIsCoinjoinBlockedByTor);
    const isCoinJoinDisabledByFeatureFlag = useSelector(state =>
        selectIsFeatureDisabled(state, Feature.coinjoin),
    );
    const featureMessageContent = useSelector(state =>
        selectFeatureMessageContent(state, Feature.coinjoin),
    );

    const anonymitySet = account.addresses?.anonymitySet;

    if (!coordinatorData || !targetAnonymity || !anonymitySet) {
        return (
            <Error
                error={`Suite could not ${
                    coordinatorData ? 'determine setup values' : 'connect to coordinator'
                }.`}
            />
        );
    }

    const serviceFee = calculateServiceFee(
        account.utxo || [],
        coordinatorData.coordinationFeeRate,
        anonymitySet,
        accountTransactions,
    );
    const maxRounds = getMaxRounds(targetAnonymity, anonymitySet);
    const isCustom = strategy === 'custom';
    const allChecked = connectedConfirmed && termsConfirmed;
    const allAnonymized = notAnonymized === '0';

    const isDisabled =
        !allChecked ||
        allAnonymized ||
        isLocked(false) ||
        isCoinJoinBlockedByTor ||
        isCoinJoinDisabledByFeatureFlag;

    const getButtonTooltipMessage = () => {
        if (isCoinJoinDisabledByFeatureFlag && featureMessageContent) {
            return featureMessageContent;
        }
        if (isCoinJoinBlockedByTor) {
            return <Translation id="TR_UNAVAILABLE_COINJOIN_TOR_DISABLE_TOOLTIP" />;
        }
        if (allAnonymized) {
            return <Translation id="TR_NOTHING_TO_ANONYMIZE" />;
        }
        if (!allChecked) {
            return <Translation id="TR_CONFIRM_CONDITIONS" />;
        }
    };

    const reset = () => {
        setStrategy('recommended');
        setCustomMaxFee(DEFAULT_MAX_MINING_FEE);
        setCustomSkipRounds(true);
    };
    const toggleConnectConfirmation = () => setConnectedConfirmed(current => !current);
    const toggleTermsConfirmation = () => setTermsConfirmed(current => !current);
    const anonymize = () =>
        actions.startCoinjoinSession(account, {
            maxCoordinatorFeeRate: coordinatorData.coordinationFeeRate.rate,
            maxFeePerKvbyte:
                (isCustom ? customMaxFee : coordinatorData.feeRatesMedians[strategy]) * 1000, // transform to kvB
            maxRounds,
            skipRounds:
                (strategy === 'custom' && customSkipRounds) || strategy === 'recommended'
                    ? RECOMMENDED_SKIP_ROUNDS
                    : undefined,
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
                        symbol={account.symbol}
                    />
                    <StyledCryptoAmountWithHeader
                        header={
                            <AmountHeading>
                                <Translation id="TR_SERVICE_FEE" />
                            </AmountHeading>
                        }
                        value={serviceFee}
                        symbol={account.symbol}
                        note={<Translation id="TR_SERVICE_FEE_NOTE" />}
                    />
                </Row>
                {isCustom ? (
                    <CoinjoinCustomStrategy
                        maxRounds={maxRounds}
                        maxFee={customMaxFee}
                        skipRounds={customSkipRounds}
                        setMaxFee={setCustomMaxFee}
                        setSkipRounds={setCustomSkipRounds}
                        reset={reset}
                    />
                ) : (
                    <CoinjoinDefaultStrategy
                        maxRounds={maxRounds}
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
                        data-test="@coinjoin/checkbox-1"
                    >
                        <Translation id="TR_DEVICE_CONNECTED_CONFIRMATION" />
                    </StyledCheckbox>
                    <TooltipSymbol content={<Translation id="TR_DEVICE_CONNECTED_TOOLTIP" />} />
                </CheckboxWrapper>
                <StyledCheckbox
                    isChecked={termsConfirmed}
                    onClick={toggleTermsConfirmation}
                    data-test="@coinjoin/checkbox-2"
                >
                    <Translation
                        id="TR_TERMS_AND_PRIVACY_CONFIRMATION"
                        values={{
                            coordinator: chunks => (
                                <Link href={ZKSNACKS_TERMS_URL} variant="underline">
                                    {chunks}
                                </Link>
                            ),
                            trezor: chunks => (
                                <TrezorLink href={DATA_TOS_COINJOIN_URL} variant="underline">
                                    {chunks}
                                </TrezorLink>
                            ),
                        }}
                    />
                </StyledCheckbox>
            </StyledCard>

            <StyledTooltipButton
                onClick={anonymize}
                isDisabled={isDisabled}
                tooltipContent={getButtonTooltipMessage()}
            >
                <Translation id="TR_ANONYMIZE" />
            </StyledTooltipButton>
        </>
    );
};
