import React from 'react';
import BigNumber from 'bignumber.js';
import styled, { css, useTheme } from 'styled-components';
import { UseFormMethods } from 'react-hook-form';
import { Input, Button, variables, Icon } from '@trezor/components';
import { FeeLevel } from '@trezor/connect';
import { Translation } from '@suite-components';
import { InputError } from '@wallet-components';
import { getInputState, getFeeUnits, isDecimalsValid, isInteger } from '@suite-common/wallet-utils';
import { ETH_DEFAULT_GAS_LIMIT } from '@suite-common/wallet-constants';
import { Account } from '@wallet-types';
import { FeeInfo } from '@wallet-types/sendForm';
import { TypedValidationRules } from '@wallet-types/form';

const Wrapper = styled.div`
    display: flex;
    width: 100%;

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
            max-width: 270px;

            ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
                max-width: 100%;
            }
        `}
`;

const Spacer = styled.div`
    display: flex;
    width: 24px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        display: none;
    }
`;

const StyledInput = styled(Input)`
    display: flex;
    flex: 1;
    min-width: 270px;
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

const FeeRateWarning = styled.div`
    display: flex;
    align-items: center;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};

    > :first-child {
        margin-right: 8px;
    }
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
    errors: FormMethods['errors'];
    register: (rules?: TypedValidationRules) => (ref: any) => void;
    getValues: FormMethods['getValues'];
    setValue: FormMethods['setValue'];
    changeFeeLimit?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    composedFeePerByte: string;
}

export const CustomFee = ({
    networkType,
    feeInfo,
    errors,
    register,
    getValues,
    setValue,
    changeFeeLimit,
    composedFeePerByte,
}: CustomFeeProps) => {
    const { maxFee, minFee } = feeInfo;

    const theme = useTheme();

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

    const validateFeeLimit = (value: string) => {
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
    };

    const validateFee = (value: string) => {
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
    };

    return (
        <div>
            <Wrapper>
                {useFeeLimit ? (
                    <>
                        <Col>
                            <StyledInput
                                label={<Translation id="TR_GAS_LIMIT" />}
                                disabled={feeLimitDisabled}
                                isMonospace
                                variant="small"
                                inputState={getInputState(feeLimitError, feeLimitValue)}
                                name={FEE_LIMIT}
                                data-test={FEE_LIMIT}
                                onChange={changeFeeLimit}
                                innerRef={register({
                                    required: 'CUSTOM_FEE_IS_NOT_SET',
                                    validate: validateFeeLimit,
                                })}
                                bottomText={<InputError error={feeLimitError} />}
                            />
                        </Col>

                        <Spacer />
                    </>
                ) : (
                    <input type="hidden" name={FEE_LIMIT} ref={register()} />
                )}
                <Col singleCol={!useFeeLimit}>
                    <StyledInput
                        noTopLabel={!useFeeLimit}
                        label={useFeeLimit ? <Translation id="TR_GAS_PRICE" /> : undefined}
                        isMonospace
                        variant="small"
                        inputState={getInputState(feePerUnitError, feePerUnitValue)}
                        innerAddon={<Units>{getFeeUnits(networkType)}</Units>}
                        name={FEE_PER_UNIT}
                        data-test={FEE_PER_UNIT}
                        innerRef={register({
                            required: 'CUSTOM_FEE_IS_NOT_SET',
                            validate: validateFee,
                        })}
                        bottomText={<InputError error={feePerUnitError} />}
                    />
                </Col>
            </Wrapper>

            {isComposedFeeRateDifferent && (
                <FeeRateWarning>
                    <Icon icon="INFO" size={12} color={theme.TYPE_LIGHTER_GREY} />
                    <Translation id="TR_FEE_ROUNDING_WARNING" />
                </FeeRateWarning>
            )}
        </div>
    );
};
