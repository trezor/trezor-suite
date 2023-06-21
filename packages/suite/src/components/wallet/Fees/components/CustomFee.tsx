import React, { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import styled, { css } from 'styled-components';
import { Control, UseFormMethods } from 'react-hook-form';
import { Button, Note, variables } from '@trezor/components';
import { FeeLevel } from '@trezor/connect';
import { Translation } from 'src/components/suite';
import { NumberInput } from 'src/components/suite/NumberInput';
import { InputError } from 'src/components/wallet';
import { getInputState, getFeeUnits, isDecimalsValid, isInteger } from '@suite-common/wallet-utils';
import { ETH_DEFAULT_GAS_LIMIT } from '@suite-common/wallet-constants';
import { Account } from 'src/types/wallet';
import { FeeInfo } from 'src/types/wallet/sendForm';
import { TypedValidationRules } from 'src/types/wallet/form';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    gap: 10px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        flex-direction: column;
    }
`;

const Col = styled.div<{ singleCol?: boolean }>`
    display: flex;
    flex: 1;

    ${({ singleCol }) =>
        singleCol &&
        css`
            max-width: 300px;

            ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
                max-width: 100%;
            }
        `}
`;

const StyledNumberInput = styled(NumberInput)`
    display: flex;
    flex: 1;
    width: 100%;
`;

const Units = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const ButtonWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const StyledButton = styled(Button)`
    margin-left: 8px;
    padding: 0;
    background: none;
`;

// feeLimit error notification button
const SetDefaultLimit = ({ onClick }: { onClick: () => void }) => (
    <ButtonWrapper>
        <Translation
            id="CUSTOM_FEE_LIMIT_BELOW_RECOMMENDED"
            isNested
            values={{
                button: (
                    <StyledButton variant="tertiary" onClick={onClick}>
                        <Translation id="CUSTOM_FEE_LIMIT_USE_RECOMMENDED" />
                    </StyledButton>
                ),
            }}
        />
    </ButtonWrapper>
);

const FEE_PER_UNIT = 'feePerUnit';
const FEE_LIMIT = 'feeLimit';

type FormMethods = UseFormMethods<{
    selectedFee?: FeeLevel['label'];
    feePerUnit?: string;
    feeLimit?: string;
    estimatedFeeLimit?: string;
}>;

interface CustomFeeProps {
    networkType: Account['networkType'];
    feeInfo: FeeInfo;
    errors: FormMethods['formState']['errors'];
    register: (rules?: TypedValidationRules) => (ref: any) => void;
    control: Control;
    getValues: FormMethods['getValues'];
    setValue: FormMethods['setValue'];
    changeFeeLimit?: (value: string) => void;
    composedFeePerByte: string;
}

export const CustomFee = ({
    networkType,
    feeInfo,
    errors,
    register,
    control,
    getValues,
    setValue,
    changeFeeLimit,
    composedFeePerByte,
}: CustomFeeProps) => {
    const { maxFee, minFee } = feeInfo;

    const feePerUnitValue = getValues(FEE_PER_UNIT);
    const feeLimitValue = getValues(FEE_LIMIT);
    const estimatedFeeLimit = getValues('estimatedFeeLimit') || ETH_DEFAULT_GAS_LIMIT;
    const enteredFeeRate = getValues('feePerUnit');

    const feePerUnitError = errors.feePerUnit;
    const feeLimitError = errors.feeLimit;

    const useFeeLimit = networkType === 'ethereum';
    const feeLimitDisabled = false;

    const isComposedFeeRateDifferent =
        !feePerUnitError && composedFeePerByte && enteredFeeRate !== composedFeePerByte;

    const feeLimitRules = useMemo<TypedValidationRules>(
        () => ({
            required: 'CUSTOM_FEE_IS_NOT_SET',
            validate: (value: string) => {
                const feeBig = new BigNumber(value);

                if (feeBig.isNaN()) {
                    return 'CUSTOM_FEE_IS_NOT_NUMBER';
                }

                // allow decimals in ETH since GWEI is not a satoshi
                if (networkType !== 'ethereum' && networkType !== 'bitcoin' && !isInteger(value)) {
                    return 'CUSTOM_FEE_IS_NOT_INTEGER';
                }

                if (feeBig.lt(estimatedFeeLimit)) {
                    return (
                        <SetDefaultLimit
                            onClick={() => {
                                setValue(FEE_LIMIT, estimatedFeeLimit, {
                                    shouldValidate: true,
                                });
                            }}
                        />
                    );
                }
            },
        }),
        [estimatedFeeLimit, networkType, setValue],
    );

    const feeRules = useMemo<TypedValidationRules>(
        () => ({
            required: 'CUSTOM_FEE_IS_NOT_SET',
            validate: (value: string) => {
                const feeBig = new BigNumber(value);

                if (feeBig.isNaN()) {
                    return 'CUSTOM_FEE_IS_NOT_NUMBER';
                }

                // allow decimals in ETH since GWEI is not a satoshi
                if (networkType !== 'ethereum' && networkType !== 'bitcoin' && !isInteger(value)) {
                    return 'CUSTOM_FEE_IS_NOT_INTEGER';
                }

                if (networkType === 'bitcoin' && !isDecimalsValid(value, 2)) {
                    return (
                        <Translation
                            key="AMOUNT_IS_NOT_IN_RANGE_DECIMALS"
                            id="AMOUNT_IS_NOT_IN_RANGE_DECIMALS"
                            values={{ decimals: 2 }}
                        />
                    );
                }

                // GWEI: 9 decimal places
                if (networkType === 'ethereum' && !isDecimalsValid(value, 9)) {
                    return (
                        <Translation
                            key="AMOUNT_IS_NOT_IN_RANGE_DECIMALS"
                            id="AMOUNT_IS_NOT_IN_RANGE_DECIMALS"
                            values={{ decimals: 9 }}
                        />
                    );
                }

                if (feeBig.isGreaterThan(maxFee) || feeBig.isLessThan(minFee)) {
                    return (
                        <Translation
                            key="CUSTOM_FEE_NOT_IN_RANGE"
                            id="CUSTOM_FEE_NOT_IN_RANGE"
                            values={{ minFee, maxFee }}
                        />
                    );
                }
            },
        }),
        [maxFee, minFee, networkType],
    );

    return (
        <>
            <Wrapper>
                {useFeeLimit ? (
                    <Col>
                        <StyledNumberInput
                            control={control}
                            label={<Translation id="TR_GAS_LIMIT" />}
                            disabled={feeLimitDisabled}
                            isMonospace
                            variant="small"
                            inputState={getInputState(feeLimitError, feeLimitValue)}
                            name={FEE_LIMIT}
                            data-test={FEE_LIMIT}
                            onChange={changeFeeLimit}
                            rules={feeLimitRules}
                            bottomText={<InputError error={feeLimitError} />}
                        />
                    </Col>
                ) : (
                    <input type="hidden" name={FEE_LIMIT} ref={register()} />
                )}
                <Col singleCol={!useFeeLimit}>
                    <StyledNumberInput
                        control={control}
                        noTopLabel={!useFeeLimit}
                        label={useFeeLimit ? <Translation id="TR_GAS_PRICE" /> : undefined}
                        isMonospace
                        variant="small"
                        inputState={getInputState(feePerUnitError, feePerUnitValue)}
                        innerAddon={<Units>{getFeeUnits(networkType)}</Units>}
                        name={FEE_PER_UNIT}
                        data-test={FEE_PER_UNIT}
                        rules={feeRules}
                        bottomText={<InputError error={feePerUnitError} />}
                    />
                </Col>
            </Wrapper>

            {isComposedFeeRateDifferent && networkType === 'bitcoin' && (
                <Note>
                    <Translation id="TR_FEE_ROUNDING_WARNING" />
                </Note>
            )}
        </>
    );
};
