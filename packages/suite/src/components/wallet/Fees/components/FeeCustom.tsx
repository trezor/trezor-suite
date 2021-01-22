import React from 'react';
import BigNumber from 'bignumber.js';
import styled, { css } from 'styled-components';
import { Input, Button, variables } from '@trezor/components';
import { Translation } from '@suite-components';
import { InputError } from '@wallet-components';
import { getInputState, getFeeUnits } from '@wallet-utils/sendFormUtils';
import { isDecimalsValid, isInteger } from '@wallet-utils/validation';
import { ETH_DEFAULT_GAS_LIMIT } from '@wallet-constants/sendForm';
import { Props } from '../index';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    margin-top: 20px;
    padding-top: 20px;

    @media all and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex-direction: column;
    }
`;

const Col = styled.div<{ singleCol?: boolean }>`
    display: flex;
    flex: 1;

    ${props =>
        props.singleCol &&
        css`
            max-width: 314px;

            @media all and (max-width: ${variables.SCREEN_SIZE.LG}) {
                max-width: 100%;
            }
        `}
`;

const Spacer = styled.div`
    display: flex;
    width: 56px;

    @media all and (max-width: ${variables.SCREEN_SIZE.LG}) {
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
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const ButtonWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const StyledButton = styled(Button)`
    margin-right: 8px;
    padding: 0;
    background: none;
`;

// feeLimit error notification button
const SetDefaultLimit = ({ feeLimit, onClick }: { feeLimit: string; onClick: () => void }) => {
    return (
        <ButtonWrapper>
            <Translation
                id="CUSTOM_FEE_LIMIT_BELOW_RECOMMENDED"
                isNested
                values={{
                    feeLimit,
                    button: (
                        <StyledButton variant="tertiary" onClick={onClick}>
                            <Translation id="CUSTOM_FEE_LIMIT_USE_RECOMMENDED" />
                        </StyledButton>
                    ),
                }}
            />
        </ButtonWrapper>
    );
};

const FEE_PER_UNIT = 'feePerUnit';
const FEE_LIMIT = 'feeLimit';

const FeeCustom = ({
    account: { networkType },
    feeInfo,
    errors,
    register,
    getValues,
    setValue,
    changeFeePerUnit,
    changeFeeLimit,
}: Props) => {
    const { maxFee, minFee } = feeInfo;
    const feePerUnitValue = getValues(FEE_PER_UNIT);
    const feePerUnitError = errors.feePerUnit;

    const useFeeLimit = networkType === 'ethereum';
    const feeLimitValue = getValues(FEE_LIMIT);
    const estimatedFeeLimit = getValues('estimatedFeeLimit');
    const feeLimitError = errors.feeLimit;
    const feeLimitDisabled = false;

    return (
        <Wrapper>
            {useFeeLimit ? (
                <>
                    <Col>
                        <StyledInput
                            label={<Translation id="TR_GAS_LIMIT" />}
                            disabled={feeLimitDisabled}
                            monospace
                            state={getInputState(feeLimitError, feeLimitValue)}
                            name={FEE_LIMIT}
                            data-test={FEE_LIMIT}
                            onChange={changeFeeLimit}
                            innerRef={register({
                                required: 'CUSTOM_FEE_IS_NOT_SET',
                                validate: (value: string) => {
                                    const feeBig = new BigNumber(value);
                                    if (feeBig.isNaN()) {
                                        return 'CUSTOM_FEE_IS_NOT_NUMBER';
                                    }
                                    if (!isInteger(value)) {
                                        return 'CUSTOM_FEE_IS_NOT_INTEGER';
                                    }
                                    if (feeBig.lt(ETH_DEFAULT_GAS_LIMIT)) {
                                        return (
                                            <SetDefaultLimit
                                                feeLimit={ETH_DEFAULT_GAS_LIMIT}
                                                onClick={() => {
                                                    setValue(FEE_LIMIT, ETH_DEFAULT_GAS_LIMIT, {
                                                        shouldValidate: true,
                                                    });
                                                }}
                                            />
                                        );
                                    }
                                    if (estimatedFeeLimit && feeBig.lt(estimatedFeeLimit)) {
                                        return (
                                            <SetDefaultLimit
                                                feeLimit={estimatedFeeLimit}
                                                onClick={() => {
                                                    setValue(FEE_LIMIT, estimatedFeeLimit, {
                                                        shouldValidate: true,
                                                    });
                                                }}
                                            />
                                        );
                                    }
                                },
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
                    monospace
                    state={getInputState(feePerUnitError, feePerUnitValue)}
                    innerAddon={<Units>{getFeeUnits(networkType)}</Units>}
                    name={FEE_PER_UNIT}
                    data-test={FEE_PER_UNIT}
                    onChange={changeFeePerUnit}
                    innerRef={register({
                        required: 'CUSTOM_FEE_IS_NOT_SET',
                        validate: (value: string) => {
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
                        },
                    })}
                    bottomText={<InputError error={feePerUnitError} />}
                />
            </Col>
        </Wrapper>
    );
};

export default FeeCustom;
