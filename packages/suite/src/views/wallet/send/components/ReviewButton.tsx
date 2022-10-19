import React from 'react';
import { useWatch } from 'react-hook-form';
import styled, { useTheme } from 'styled-components';

import { Checkbox, TooltipButton, Warning, variables } from '@trezor/components';
import { useDevice } from '@suite-hooks';
import { useSendFormContext } from '@wallet-hooks';
import { Translation } from '@suite-components/Translation';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    margin: 32px 0;
    flex-direction: column;
`;

const ButtonReview = styled(Button)`
    min-width: 200px;
    margin-bottom: 5px;

    :disabled {
        background: ${({ theme }) => theme.STROKE_GREY};
    }
`;

const Row = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 5px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};

    :last-child {
        padding-bottom: 0;
    }
`;

export const ReviewButton = () => {
    const { device, isLocked } = useDevice();
    const { online, isLoading, signTransaction, getValues, getDefaultValue, composedLevels } =
        useSendFormContext();

    const theme = useTheme();

    const values = getValues();
    const broadcastEnabled = getDefaultValue('options', []).includes('broadcast');
    const composedTx = composedLevels ? composedLevels[values.selectedFee || 'normal'] : undefined;
    const isDisabled =
        !composedTx ||
        composedTx.type !== 'final' ||
        isLocked() ||
        (device && !device.available) ||
        !online;

    return (
        <>
            {possibleToSubmit && isLowAnonymityUtxoSelected && (
                <StyledWarning critical>
                    <Checkbox
                        color={theme.BG_RED}
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
                data-test="@send/review-button"
                isDisabled={isDisabled || isLoading}
                onClick={signTransaction}
            >
                <Translation id={primaryText} />
                {isOutputWarning ||
                    (isLowAnonymityUtxoSelected && (
                        <SecondLine>
                            <Translation id={secondaryText} />
                        </SecondLine>
                    ))}
            </ButtonReview>
        </>
    );
};
