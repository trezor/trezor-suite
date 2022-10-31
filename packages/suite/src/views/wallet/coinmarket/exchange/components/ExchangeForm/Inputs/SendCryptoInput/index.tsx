import { Input } from '@trezor/components';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import {
    amountToSatoshi,
    formatAmount,
    formatNetworkAmount,
    isDecimalsValid,
    isInteger,
    getInputState,
} from '@suite-common/wallet-utils';
import { useCoinmarketExchangeFormContext } from '@wallet-hooks/useCoinmarketExchangeForm';
import { FormattedCryptoAmount, Translation } from '@suite-components';
import SendCryptoSelect from './SendCryptoSelect';
import { InputError } from '@wallet-components';
import Bignumber from 'bignumber.js';
import { MAX_LENGTH } from '@suite-constants/inputs';
import { CRYPTO_INPUT, CRYPTO_TOKEN, FIAT_INPUT } from '@wallet-types/coinmarketExchangeForm';
import { useBitcoinAmountUnit } from '@wallet-hooks/useBitcoinAmountUnit';

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
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const { symbol, tokens } = account;

    const tokenAddress = getValues(CRYPTO_TOKEN);
    const tokenData = tokens?.find(t => t.address === tokenAddress);

    const conversion = shouldSendInSats ? amountToSatoshi : formatAmount;
    const formattedAvailableBalance = tokenData
        ? tokenData.balance || '0'
        : conversion(account.availableBalance, network.decimals);
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

    const cryptoInputRef = register({
        validate: (value: string) => {
            const amountBig = new Bignumber(value);
            if (value) {
                if (amountBig.isNaN()) {
                    return 'AMOUNT_IS_NOT_NUMBER';
                }

                if (shouldSendInSats && !isInteger(value)) {
                    return 'AMOUNT_IS_NOT_INTEGER';
                }

                if (amountBig.lte(0)) {
                    return 'AMOUNT_IS_TOO_LOW';
                }

                if (amountLimits) {
                    const amount = Number(value);

                    let minCrypto = 0;
                    if (amountLimits.min) {
                        minCrypto = shouldSendInSats
                            ? Number(amountToSatoshi(amountLimits.min.toString(), network.decimals))
                            : amountLimits.min;
                    }
                    if (minCrypto && amount < minCrypto) {
                        return (
                            <Translation
                                id="TR_EXCHANGE_VALIDATION_ERROR_MINIMUM_CRYPTO"
                                values={{
                                    minimum: (
                                        <FormattedCryptoAmount
                                            value={amountLimits.min}
                                            symbol={amountLimits.currency}
                                        />
                                    ),
                                }}
                            />
                        );
                    }

                    let maxCrypto = 0;
                    if (amountLimits.max) {
                        maxCrypto = shouldSendInSats
                            ? Number(amountToSatoshi(amountLimits.max.toString(), network.decimals))
                            : amountLimits.max;
                    }
                    if (maxCrypto && amount > maxCrypto) {
                        return (
                            <Translation
                                id="TR_EXCHANGE_VALIDATION_ERROR_MAXIMUM_CRYPTO"
                                values={{
                                    maximum: (
                                        <FormattedCryptoAmount
                                            value={amountLimits.max}
                                            symbol={amountLimits.currency}
                                        />
                                    ),
                                }}
                            />
                        );
                    }
                }

                if (amountBig.gt(formattedAvailableBalance)) {
                    if (reserve && amountBig.lt(formatNetworkAmount(account.balance, symbol))) {
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
    });

    return (
        <StyledInput
            onChange={event => {
                updateFiatValue(event.target.value);
                clearErrors(FIAT_INPUT);
                setValue('setMaxOutputId', undefined, { shouldDirty: true });
                composeRequest();
            }}
            inputState={getInputState(amountError || fiatError, amount)}
            name={CRYPTO_INPUT}
            noTopLabel
            maxLength={MAX_LENGTH.AMOUNT}
            isToken={!!tokenData}
            innerRef={cryptoInputRef}
            bottomText={<InputError error={amountError} />}
            innerAddon={<SendCryptoSelect />}
        />
    );
};

export default SendCryptoInput;
