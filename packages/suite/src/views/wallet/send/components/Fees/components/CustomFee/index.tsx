import React from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Input, variables, colors } from '@trezor/components';
import { InputError } from '@wallet-components';
import { useSendFormContext } from '@wallet-hooks';
import { getInputState, getFeeUnits } from '@wallet-utils/sendFormUtils';

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
                    composeTransaction('feePerUnit', !!feePerUnitError);
                }}
                name={inputName}
                data-test={inputName}
                innerRef={register({
                    required: 'TR_CUSTOM_FEE_IS_NOT_SET',
                    validate: (value: string) => {
                        const feeBig = new BigNumber(value);
                        if (feeBig.isNaN()) {
                            return 'TR_CUSTOM_FEE_IS_NOT_NUMBER';
                        }
                        if (!feeBig.isInteger()) {
                            return 'TR_CUSTOM_FEE_IS_NOT_INTEGER';
                        }
                        if (feeBig.isGreaterThan(maxFee) || feeBig.isLessThan(minFee)) {
                            return 'TR_CUSTOM_FEE_NOT_IN_RANGE';
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
                        composeTransaction('feeLimit', !!error);
                    }}
                    innerRef={register({
                        required: 'TR_CUSTOM_FEE_IS_NOT_SET',
                        validate: (value: string) => {
                            const feeBig = new BigNumber(value);
                            if (feeBig.isNaN()) {
                                return 'TR_CUSTOM_FEE_IS_NOT_NUMBER';
                            }

                            if (feeBig.isGreaterThan(maxFee) || feeBig.isLessThan(minFee)) {
                                return 'TR_CUSTOM_FEE_NOT_IN_RANGE';
                            }
                        },
                    })}
                    bottomText={<InputError error={feeLimitError} />}
                />
            )} */}
        </Wrapper>
    );
};
