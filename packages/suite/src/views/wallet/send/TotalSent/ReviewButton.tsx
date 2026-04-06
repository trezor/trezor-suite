import { useWatch } from 'react-hook-form';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectAreFeesLoading } from '@suite-common/wallet-core';
import { isLowAnonymityWarning } from '@suite-common/wallet-utils';
import { Banner, Button, Checkbox, Column, Paragraph, Tooltip } from '@trezor/components';
import { paletteV2, spacingsPx } from '@trezor/theme';

import { setConnectionModal, setConnectionMode } from 'src/actions/device/deviceSlice';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    grid-column: 1 / 3;
    gap: ${spacingsPx.md};
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
    color: ${paletteV2.globalWhiteAlpha1000};
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
`;

export const ReviewButton = () => {
    const { device, isLocked } = useDevice();
    const dispatch = useDispatch();
    const {
        account: { networkType, symbol },
        control,
        formState: { errors },
        online,
        isLoading: isSendFormLoading,
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
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, symbol));
    const isLoading = isSendFormLoading || areFeesLoading;

    const isDeviceConnected = device?.connected && device?.available;

    const options = useWatch({
        name: 'options',
        defaultValue: getDefaultValue('options', []),
        control,
    });

    const values = getValues();
    const broadcastEnabled = options.includes('broadcast');
    const coinControlOpen = options.includes('utxoSelection');
    const requireDestinationTag =
        (networkType === 'ripple' || networkType === 'stellar') &&
        options.includes('destinationTag') &&
        values.destinationTag === '';

    const composedTx = composedLevels ? composedLevels[values.selectedFee || 'normal'] : undefined;
    const isLowAnonymity =
        Array.isArray(errors.outputs) &&
        errors.outputs.some(output => isLowAnonymityWarning(output));
    const possibleToSubmit =
        composedTx?.type === 'final' &&
        online &&
        !isLowAnonymity &&
        !errors.feeLimit &&
        (isDeviceConnected ? !isLocked() : true);

    const confirmationRequired =
        possibleToSubmit && isLowAnonymityUtxoSelected && !anonymityWarningChecked;
    const isDisabled = requireDestinationTag || !possibleToSubmit || confirmationRequired;
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

    const handleButtonReviewClick = () => {
        if (!isDeviceConnected) {
            if (device?.descriptor?.apiType === 'bluetooth') {
                dispatch(setConnectionMode('bluetooth'));
            }
            dispatch(setConnectionModal(true));

            return;
        }
        signTransaction();
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
                <Banner
                    intent="critical"
                    description={
                        <Checkbox
                            isChecked={anonymityWarningChecked}
                            onChange={toggleAnonymityWarning}
                        >
                            <Translation id="TR_BREAKING_ANONYMITY_CHECKBOX" />
                        </Checkbox>
                    }
                />
            )}

            <Tooltip content={tooltipContent}>
                <Button
                    intent={anonymityWarningChecked ? 'critical' : 'brand'}
                    data-testid="@send/review-button"
                    isDisabled={isDisabled || isLoading}
                    onClick={handleButtonReviewClick}
                    minWidth={200}
                    size="large"
                >
                    <Column alignItems="center" gap={4}>
                        <Translation id={getPrimaryText()} />
                        {buttonHasTwoLines && (
                            <Paragraph typographyStyle="body-xs">
                                <Translation id={secondaryText} />
                            </Paragraph>
                        )}
                    </Column>
                </Button>
            </Tooltip>
        </Container>
    );
};
