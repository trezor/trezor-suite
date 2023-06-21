import React, { useMemo } from 'react';
import styled from 'styled-components';
import { InputError } from 'src/components/wallet';
import { isDecimalsValid, getInputState } from '@suite-common/wallet-utils';
import { useCoinmarketExchangeFormContext } from 'src/hooks/wallet/useCoinmarketExchangeForm';
import { Translation, NumberInput } from 'src/components/suite';
import FiatSelect from './FiatSelect';
import BigNumber from 'bignumber.js';
import { MAX_LENGTH } from 'src/constants/suite/inputs';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/coinmarketExchangeForm';
import { TypedValidationRules } from 'src/types/wallet/form';

const StyledInput = styled(NumberInput)`
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
`;

const FiatInput = () => {
    const {
        control,
        network,
        clearErrors,
        formState: { errors },
        trigger,
        updateSendCryptoValue,
        setValue,
        getValues,
    } = useCoinmarketExchangeFormContext();

    const amountError = errors.outputs?.[0]?.amount;
    const fiatError = errors.outputs?.[0]?.fiat;

    const { outputs } = getValues();
    const fiat = outputs?.[0]?.fiat;

    const fiatInputRules = useMemo<TypedValidationRules>(
        () => ({
            validate: (value: any) => {
                if (value) {
                    const amountBig = new BigNumber(value);
                    if (amountBig.isNaN()) {
                        return 'AMOUNT_IS_NOT_NUMBER';
                    }

                    if (!isDecimalsValid(value, 2)) {
                        return (
                            <Translation
                                id="AMOUNT_IS_NOT_IN_RANGE_DECIMALS"
                                values={{ decimals: 2 }}
                            />
                        );
                    }

                    if (amountBig.lte(0)) {
                        return 'AMOUNT_IS_TOO_LOW';
                    }
                }
            },
        }),
        [],
    );

    return (
        <StyledInput
            control={control}
            onFocus={() => {
                trigger([FIAT_INPUT]);
            }}
            onChange={value => {
                setValue('setMaxOutputId', undefined);
                if (fiatError) {
                    setValue(CRYPTO_INPUT, '');
                } else {
                    updateSendCryptoValue(value, network.decimals);
                    clearErrors(FIAT_INPUT);
                }
            }}
            inputState={getInputState(fiatError || amountError, fiat)}
            name={FIAT_INPUT}
            noTopLabel
            maxLength={MAX_LENGTH.AMOUNT}
            rules={fiatInputRules}
            bottomText={<InputError error={fiatError} />}
            innerAddon={<FiatSelect />}
            data-test="@coinmarket/exchange/fiat-input"
        />
    );
};

export default FiatInput;
