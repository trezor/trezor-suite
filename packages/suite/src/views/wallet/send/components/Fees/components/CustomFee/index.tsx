import React from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Input, variables, colors } from '@trezor/components';
import { Translation } from '@suite-components';
import { InputError } from '@wallet-components';
import { useSendFormContext } from '@wallet-hooks';
import { getInputState, getFeeUnits } from '@wallet-utils/sendFormUtils';
import { isDecimalsValid } from '@wallet-utils/validation';

const Wrapper = styled.div`
    display: flex;
    padding-left: 11px;
`;

const Units = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

export default () => {
    const {
        network,
        feeInfo,
        errors,
        register,
        getDefaultValue,
        changeCustomFeeLevel,
        composeTransaction,
    } = useSendFormContext();
    const { maxFee, minFee } = feeInfo;
    const inputName = 'feePerUnit';
    const feePerUnitValue = getDefaultValue(inputName);
    const feePerUnitError = errors.feePerUnit;
    // const feeLimitError = errors.feeLimit;
    // const error = feePerUnitError || feeLimitError;
    // const feeLimitDisabled = network.networkType === 'ethereum' && !!getValues('ethereumDataHex');

    return (
        <Wrapper>
            <Input
                noTopLabel
                variant="small"
                monospace
                width={120}
                state={getInputState(feePerUnitError, feePerUnitValue)}
                innerAddon={<Units>{getFeeUnits(network.networkType)}</Units>}
                onChange={() => {
                    changeCustomFeeLevel(!!feePerUnitError);
                    composeTransaction('feePerUnit', !!feePerUnitError);
                }}
                name={inputName}
                data-test={inputName}
                innerRef={register({
                    required: 'CUSTOM_FEE_IS_NOT_SET',
                    validate: (value: string) => {
                        const feeBig = new BigNumber(value);
                        if (feeBig.isNaN()) {
                            return 'CUSTOM_FEE_IS_NOT_NUMBER';
                        }
                        // allow decimals in ETH since GWEI is not a satoshi
                        if (network.networkType !== 'ethereum' && !feeBig.isInteger()) {
                            return 'CUSTOM_FEE_IS_NOT_INTEGER';
                        }
                        if (network.networkType === 'ethereum' && !isDecimalsValid(value, 9)) {
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
            <input type="hidden" name="feeLimit" ref={register()} />
            {/*
            We've decided not to confuse user with gasLimit input which is not recommended to change anyway
            especially when it comes to using tokens or data
            it's working but commended out until we decide otherwise
            {network.networkType === 'ethereum' && (
                <Input
                    noTopLabel
                    disabled={feeLimitDisabled}
                    variant="small"
                    name="feeLimit"
                    width={120}
                    state={getInputState(feePerUnitError)}
                    innerAddon={<Units>GWEI</Units>}
                    onChange={() => {
                        changeCustomFeeLevel(!!feeLimitError);
                        composeTransaction('feeLimit', !!feeLimitError);
                    }}
                    innerRef={register({
                        required: 'CUSTOM_FEE_IS_NOT_SET',
                        validate: (value: string) => {
                            const feeBig = new BigNumber(value);
                            if (feeBig.isNaN()) {
                                return 'CUSTOM_FEE_IS_NOT_NUMBER';
                            }
                        },
                    })}
                    bottomText={<InputError error={feeLimitError} />}
                />
            )} */}
        </Wrapper>
    );
};
