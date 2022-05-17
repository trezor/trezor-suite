import React from 'react';
import BigNumber from 'bignumber.js';
import styled, { css } from 'styled-components';
import { UseFormMethods } from 'react-hook-form';
import { Input, Button, variables } from '@trezor/components';
import { Translation } from '@suite-components';
import { InputError } from '@wallet-components';
import { getInputState, getFeeUnits } from '@wallet-utils/sendFormUtils';
import { isDecimalsValid, isInteger } from '@wallet-utils/validation';
import { ETH_DEFAULT_GAS_LIMIT } from '@wallet-constants/sendForm';
import { Account } from '@wallet-types';
import { FeeInfo } from '@wallet-types/sendForm';
import { TypedValidationRules } from '@wallet-types/form';
import { FeeLevel } from 'packages/connect/lib';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    margin-top: 20px;
    padding-top: 20px;

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
            max-width: 314px;

            ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
                max-width: 100%;
            }
        `}
`;

const Spacer = styled.div`
    display: flex;
    width: 56px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        display: none;
    }
`;

const StyledInput = styled(Input)`
    display: flex;
    flex: 1;
    min-width: 260px;
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
    account: Account;
    feeInfo: FeeInfo;
    errors: FormMethods['errors'];
    register: (rules?: TypedValidationRules) => (ref: any) => void;
    getValues: FormMethods['getValues'];
    setValue: FormMethods['setValue'];
    changeFeePerUnit?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    changeFeeLimit?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CustomFee = ({
    account: { networkType },
    feeInfo,
    errors,
    register,
    getValues,
    setValue,
    changeFeePerUnit,
    changeFeeLimit,
}: CustomFeeProps) => {
    const { maxFee, minFee } = feeInfo;

    const feePerUnitValue = getValues(FEE_PER_UNIT);
    const feeLimitValue = getValues(FEE_LIMIT);
    const estimatedFeeLimit = getValues('estimatedFeeLimit') || ETH_DEFAULT_GAS_LIMIT;

    const feePerUnitError = errors.feePerUnit;
    const feeLimitError = errors.feeLimit;

    const useFeeLimit = networkType === 'ethereum';
    const feeLimitDisabled = false;

    const validateFeeLimit = (value: string) => {
        const feeBig = new BigNumber(value);

        if (feeBig.isNaN()) {
            return 'CUSTOM_FEE_IS_NOT_NUMBER';
        }

        if (!isInteger(value)) {
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

    const valiedateFee = (value: string) => {
        const feeBig = new BigNumber(value);

        if (feeBig.isNaN()) {
            return 'CUSTOM_FEE_IS_NOT_NUMBER';
        }
        // allow decimals in ETH since GWEI is not a satoshi
        if (networkType !== 'ethereum' && !isInteger(value)) {
            return 'CUSTOM_FEE_IS_NOT_INTEGER';
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
        <Wrapper>
            {useFeeLimit ? (
                <>
                    <Col>
                        <StyledInput
                            label={<Translation id="TR_GAS_LIMIT" />}
                            disabled={feeLimitDisabled}
                            isMonospace
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
                    inputState={getInputState(feePerUnitError, feePerUnitValue)}
                    innerAddon={<Units>{getFeeUnits(networkType)}</Units>}
                    name={FEE_PER_UNIT}
                    data-test={FEE_PER_UNIT}
                    onChange={changeFeePerUnit}
                    innerRef={register({
                        required: 'CUSTOM_FEE_IS_NOT_SET',
                        validate: valiedateFee,
                    })}
                    bottomText={<InputError error={feePerUnitError} />}
                />
            </Col>
        </Wrapper>
    );
};
