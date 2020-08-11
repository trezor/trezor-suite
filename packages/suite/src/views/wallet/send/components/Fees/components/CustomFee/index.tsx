import React from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Input, variables, colors } from '@trezor/components';
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
        getValues,
        register,
        composeTransaction,
    } = useSendFormContext();
    const { maxFee, minFee } = feeInfo;
    const feePerUnitError = errors.feePerUnit;
    const feeLimitError = errors.feeLimit;
    const error = feePerUnitError || feeLimitError;
    const feeLimitDisabled =
        network.networkType === 'ethereum' && !!getValues('outputs[0].dataHex');

    return (
        <Wrapper>
            <Input
                noTopLabel
                variant="small"
                name="feePerUnit"
                width={120}
                state={getInputState(feePerUnitError)}
                innerAddon={<Units>{getFeeUnits(network.networkType)}</Units>}
                onChange={() => {
                    composeTransaction('feePerUnit', !!error);
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
                bottomText={feePerUnitError && feePerUnitError.message}
            />
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
                    bottomText={feePerUnitError && feePerUnitError.message}
                />
            )}
        </Wrapper>
    );
};
