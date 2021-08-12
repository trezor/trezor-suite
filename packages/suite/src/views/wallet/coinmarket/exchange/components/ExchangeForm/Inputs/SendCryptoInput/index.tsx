import { Input } from '@trezor/components';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { FIAT } from '@suite-config';
import { isDecimalsValid, isInteger } from '@wallet-utils/validation';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import { Translation } from '@suite-components';
import SendCryptoSelect from './SendCryptoSelect';
import { InputError } from '@wallet-components';
import Bignumber from 'bignumber.js';
import { MAX_LENGTH } from '@suite-constants/inputs';
import { formatCryptoAmount } from '@wallet-utils/coinmarket/coinmarketUtils';
import { CRYPTO_INPUT, CRYPTO_TOKEN, FIAT_INPUT } from '@wallet-types/coinmarketExchangeForm';
import { getInputState } from '@suite/utils/wallet/sendFormUtils';

export const buildCurrencyOptions = () => {
    const result: { value: string; label: string }[] = [];
    FIAT.currencies.forEach(currency =>
        result.push({ value: currency, label: currency.toUpperCase() }),
    );
    return result;
};

const StyledInput = styled(Input)<{ isToken: boolean }>`
    ${props =>
        !props.isToken && {
            'border-right': 0,
            'border-top-right-radius': 0,
            'border-bottom-right-radius': 0,
            'padding-right': '105px',
        }}
`;

const SendCryptoInput = () => {
    const {
        register,
        errors,
        clearErrors,
        network,
        account,
        amountLimits,
        composeRequest,
        updateFiatValue,
        getValues,
        setValue,
    } = useCoinmarketExchangeFormContext();
    const { symbol, tokens } = account;

    const tokenAddress = getValues(CRYPTO_TOKEN);
    const tokenData = tokens?.find(t => t.address === tokenAddress);

    const formattedAvailableBalance = tokenData
        ? tokenData.balance || '0'
        : formatNetworkAmount(account.availableBalance, account.symbol);
    const reserve =
        account.networkType === 'ripple'
            ? formatNetworkAmount(account.misc.reserve, account.symbol)
            : undefined;
    const decimals = tokenData ? tokenData.decimals : network.decimals;

    const { outputs } = getValues();
    const amount = outputs?.[0]?.amount;

    useEffect(() => {
        composeRequest();
    }, [amount, composeRequest]);

    const amountError = errors.outputs?.[0]?.amount;
    const fiatError = errors.outputs?.[0]?.fiat;

    return (
        <StyledInput
            onChange={event => {
                updateFiatValue(event.target.value);
                clearErrors(FIAT_INPUT);
                setValue('setMaxOutputId', undefined, { shouldDirty: true });
                composeRequest();
            }}
            state={getInputState(amountError || fiatError, amount)}
            name={CRYPTO_INPUT}
            noTopLabel
            maxLength={MAX_LENGTH.AMOUNT}
            isToken={!!tokenData}
            innerRef={register({
                validate: (value: string) => {
                    const amountBig = new Bignumber(value);
                    if (value) {
                        if (amountBig.isNaN()) {
                            return 'AMOUNT_IS_NOT_NUMBER';
                        }

                        if (amountBig.lte(0)) {
                            return 'AMOUNT_IS_TOO_LOW';
                        }

                        if (amountLimits) {
                            const amount = Number(value);
                            if (amountLimits.min && amount < amountLimits.min) {
                                return (
                                    <Translation
                                        id="TR_EXCHANGE_VALIDATION_ERROR_MINIMUM_CRYPTO"
                                        values={{
                                            minimum: formatCryptoAmount(amountLimits.min),
                                            currency: amountLimits.currency,
                                        }}
                                    />
                                );
                            }

                            if (amountLimits.max && amount > amountLimits.max) {
                                return (
                                    <Translation
                                        id="TR_EXCHANGE_VALIDATION_ERROR_MAXIMUM_CRYPTO"
                                        values={{
                                            maximum: formatCryptoAmount(amountLimits.max),
                                            currency: amountLimits.currency,
                                        }}
                                    />
                                );
                            }
                        }

                        if (amountBig.gt(formattedAvailableBalance)) {
                            if (
                                reserve &&
                                amountBig.lt(formatNetworkAmount(account.balance, symbol))
                            ) {
                                return (
                                    <Translation
                                        key="AMOUNT_IS_MORE_THAN_RESERVE"
                                        id="AMOUNT_IS_MORE_THAN_RESERVE"
                                        values={{ reserve }}
                                    />
                                );
                            }
                            return 'AMOUNT_IS_NOT_ENOUGH';
                        }

                        // ERC20 without decimal places
                        if (!decimals && !isInteger(value)) {
                            return 'AMOUNT_IS_NOT_INTEGER';
                        }

                        if (!isDecimalsValid(value, decimals)) {
                            return (
                                <Translation
                                    key="AMOUNT_IS_NOT_IN_RANGE_DECIMALS"
                                    id="AMOUNT_IS_NOT_IN_RANGE_DECIMALS"
                                    values={{ decimals }}
                                />
                            );
                        }
                    }
                },
            })}
            bottomText={<InputError error={amountError} />}
            innerAddon={<SendCryptoSelect />}
        />
    );
};

export default SendCryptoInput;
