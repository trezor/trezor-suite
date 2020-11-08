import { Input } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';
import { InputError } from '@wallet-components';
import { isDecimalsValid } from '@wallet-utils/validation';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import { Translation } from '@suite-components';
import FiatSelect from './FiatSelect';
import BigNumber from 'bignumber.js';

const StyledInput = styled(Input)`
    margin-left: 2px;
`;

const FiatInput = () => {
    const {
        register,
        network,
        clearErrors,
        errors,
        trigger,
        formState,
        updateReceiveCryptoValue,
        setMax,
        setValue,
    } = useCoinmarketExchangeFormContext();
    const fiatInput = 'fiatInput';

    return (
        <StyledInput
            onFocus={() => {
                trigger([fiatInput]);
            }}
            onChange={event => {
                setMax(false);
                if (errors[fiatInput]) {
                    setValue('receiveCryptoInput', '');
                } else {
                    updateReceiveCryptoValue(event.target.value, network.decimals);
                    clearErrors(fiatInput);
                }
            }}
            state={errors[fiatInput] ? 'error' : undefined}
            name={fiatInput}
            noTopLabel
            innerRef={register({
                validate: (value: any) => {
                    if (value) {
                        const amountBig = new BigNumber(value);
                        if (amountBig.isNaN()) {
                            return 'AMOUNT_IS_NOT_NUMBER';
                        }

                        if (!isDecimalsValid(value, 18)) {
                            return <Translation id="TR_EXCHANGE_VALIDATION_ERROR_NOT_NUMBER" />;
                        }
                    }

                    if (formState.isSubmitting) {
                        return <Translation id="TR_EXCHANGE_VALIDATION_ERROR_EMPTY" />;
                    }
                },
            })}
            bottomText={<InputError error={errors[fiatInput]} />}
            innerAddon={<FiatSelect />}
        />
    );
};

export default FiatInput;
