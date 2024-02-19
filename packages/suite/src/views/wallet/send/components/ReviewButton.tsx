import { useWatch } from 'react-hook-form';
import styled from 'styled-components';

import { Checkbox, TooltipButton, Warning, variables } from '@trezor/components';
import { useDevice } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { isLowAnonymityWarning } from '@suite-common/wallet-utils';
import { Translation } from 'src/components/suite/Translation';
import { spacingsPx } from '@trezor/theme';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    grid-column: 1 / 3;
    gap: ${spacingsPx.md};
`;

const StyledWarning = styled(Warning)`
    justify-content: flex-start;
`;

const ButtonReview = styled(TooltipButton)<{ isRed: boolean }>`
    background: ${({ isRed, theme }) => isRed && theme.BUTTON_RED};
    display: flex;
    flex-direction: column;
    min-width: 200px;

    :disabled {
        background: ${({ theme }) => theme.STROKE_GREY};
    }

    :hover {
        background: ${({ isRed, theme }) => isRed && theme.BUTTON_RED_HOVER};
    }
`;

const TooltipHeading = styled.p`
    opacity: 0.6;
`;

const List = styled.ul`
    list-style: disc;
    margin-left: 16px;
`;

const TextButton = styled.button`
    background: none;
    border: none;
    color: ${({ theme }) => theme.TYPE_WHITE};
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
`;

const SecondLine = styled.p`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

export const ReviewButton = () => {
    const { device, isLocked } = useDevice();
    const {
        control,
        formState: { errors },
        online,
        isLoading,
        signTransaction,
        getValues,
        getDefaultValue,
        toggleOption,
        composedLevels,
        utxoSelection: {
            anonymityWarningChecked,
            isCoinControlEnabled,
            isLowAnonymityUtxoSelected,
            toggleAnonymityWarning,
        },
    } = useSendFormContext();

    const options = useWatch({
        name: 'options',
        defaultValue: getDefaultValue('options', []),
        control,
    });

    const values = getValues();
    const broadcastEnabled = options.includes('broadcast');
    const coinControlOpen = options.includes('utxoSelection');
    const composedTx = composedLevels ? composedLevels[values.selectedFee || 'normal'] : undefined;
    const isLowAnonymity =
        Array.isArray(errors.outputs) &&
        errors.outputs.some(output => isLowAnonymityWarning(output));
    const possibleToSubmit =
        composedTx?.type === 'final' &&
        !isLocked() &&
        device?.available &&
        online &&
        !isLowAnonymity;
    const confirmationRequired =
        possibleToSubmit && isLowAnonymityUtxoSelected && !anonymityWarningChecked;
    const isDisabled = !possibleToSubmit || confirmationRequired;
    const showCoinControlWarning = possibleToSubmit && isLowAnonymityUtxoSelected;
    const buttonHasTwoLines = isLowAnonymity || showCoinControlWarning;
    const secondaryText = isCoinControlEnabled
        ? 'TR_YOU_SHOULD_ANONYMIZE'
        : 'TR_NOT_ENOUGH_ANONYMIZED_FUNDS';

    const toggleUtxoSelection = () => toggleOption('utxoSelection');
    const getPrimaryText = () => {
        if (showCoinControlWarning) {
            return broadcastEnabled
                ? 'TR_SEND_NOT_ANONYMIZED_COINS'
                : 'TR_SIGN_WITH_NOT_ANONYMIZED_COINS';
        }

        return broadcastEnabled ? 'REVIEW_AND_SEND_TRANSACTION' : 'SIGN_TRANSACTION';
    };

    const tooltipContent =
        isLowAnonymity || confirmationRequired ? (
            <>
                <TooltipHeading>
                    <Translation id="TR_NOT_ENOUGH_ANONYMIZED_FUNDS_TOOLTIP" />
                </TooltipHeading>
                <List>
                    <li>
                        <Translation id="TR_ANONYMIZATION_OPTION_1" />
                    </li>
                    <li>
                        <Translation
                            id="TR_ANONYMIZATION_OPTION_2"
                            values={{
                                button: chunks =>
                                    coinControlOpen ? (
                                        chunks
                                    ) : (
                                        <TextButton onClick={toggleUtxoSelection}>
                                            {chunks}
                                        </TextButton>
                                    ),
                            }}
                        />
                    </li>
                    <li>
                        <Translation id="TR_ANONYMIZATION_OPTION_3" />
                    </li>
                </List>
            </>
        ) : null;

    return (
        <Container>
            {showCoinControlWarning && (
                <StyledWarning variant="critical">
                    <Checkbox
                        variant="alert-red"
                        isChecked={anonymityWarningChecked}
                        onClick={toggleAnonymityWarning}
                    >
                        <Translation id="TR_BREAKING_ANONYMITY_CHECKBOX" />
                    </Checkbox>
                </StyledWarning>
            )}

            <ButtonReview
                interactiveTooltip={!coinControlOpen}
                isRed={anonymityWarningChecked}
                tooltipContent={tooltipContent}
                data-test-id="@send/review-button"
                isDisabled={isDisabled || isLoading}
                onClick={signTransaction}
            >
                <Translation id={getPrimaryText()} />
                {buttonHasTwoLines && (
                    <SecondLine>
                        <Translation id={secondaryText} />
                    </SecondLine>
                )}
            </ButtonReview>
        </Container>
    );
};
