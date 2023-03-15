import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import invityAPI from '@suite-services/invityAPI';
import Bignumber from 'bignumber.js';
import { Controller } from 'react-hook-form';
import { FIAT } from '@suite-config';
import { FormattedCryptoAmount, Translation, NumberInput } from '@suite-components';
import { getCryptoOptions } from '@wallet-utils/coinmarket/buyUtils';
import { Select, CoinLogo } from '@trezor/components';
import { buildOption } from '@wallet-utils/coinmarket/coinmarketUtils';
import { useCoinmarketBuyFormContext } from '@wallet-hooks/useCoinmarketBuyForm';
import {
    amountToSatoshi,
    isDecimalsValid,
    isInteger,
    getInputState,
} from '@suite-common/wallet-utils';
import { InputError } from '@wallet-components';
import { MAX_LENGTH } from '@suite-constants/inputs';
import { Wrapper, Left, Middle, Right, StyledIcon } from '@wallet-views/coinmarket';
import { useBitcoinAmountUnit } from '@wallet-hooks/useBitcoinAmountUnit';
import { TypedValidationRules } from '@wallet-types/form';

const Option = styled.div`
    display: flex;
    align-items: center;
`;

const Label = styled.div`
    padding-left: 10px;
`;

const TokenLogo = styled.img`
    display: flex;
    align-items: center;
    height: 18px;
`;

const Inputs = () => {
    const {
        errors,
        trigger,
        account,
        network,
        control,
        setValue,
        clearErrors,
        formState,
        amountLimits,
        buyInfo,
        setAmountLimits,
        defaultCurrency,
        cryptoInputValue,
        getValues,
        exchangeCoinInfo,
    } = useCoinmarketBuyFormContext();
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);

    const { symbol } = account;
    const uppercaseSymbol = symbol.toUpperCase();
    const fiatInput = 'fiatInput';
    const cryptoInput = 'cryptoInput';
    const currencySelect = 'currencySelect';
    const cryptoSelect = 'cryptoSelect';
    const [activeInput, setActiveInput] = useState<'fiatInput' | 'cryptoInput'>(fiatInput);
    // if cryptoInput has a valid value, set it as the activeInput
    if (cryptoInputValue && !errors[cryptoInput] && activeInput === fiatInput) {
        setActiveInput(cryptoInput);
    }

    useEffect(() => {
        trigger([activeInput]);
    }, [activeInput, amountLimits, trigger]);

    const fiatInputValue = getValues('fiatInput');

    const fiatInputRules = useMemo<TypedValidationRules>(
        () => ({
            validate: (value: string) => {
                if (activeInput === fiatInput) {
                    if (!value) {
                        if (formState.isSubmitting) {
                            return <Translation id="TR_BUY_VALIDATION_ERROR_EMPTY" />;
                        }
                        return;
                    }

                    const amountBig = new Bignumber(value);
                    if (amountBig.isNaN()) {
                        return <Translation id="AMOUNT_IS_NOT_NUMBER" />;
                    }

                    if (amountBig.lte(0)) {
                        return <Translation id="AMOUNT_IS_TOO_LOW" />;
                    }

                    if (!isDecimalsValid(value, 2)) {
                        return (
                            <Translation
                                id="AMOUNT_IS_NOT_IN_RANGE_DECIMALS"
                                values={{ decimals: 2 }}
                            />
                        );
                    }

                    if (amountLimits) {
                        const amount = Number(value);
                        if (amountLimits.minFiat && amount < amountLimits.minFiat) {
                            return (
                                <Translation
                                    id="TR_BUY_VALIDATION_ERROR_MINIMUM_FIAT"
                                    values={{
                                        minimum: amountLimits.minFiat,
                                        currency: amountLimits.currency,
                                    }}
                                />
                            );
                        }
                        if (amountLimits.maxFiat && amount > amountLimits.maxFiat) {
                            return (
                                <Translation
                                    id="TR_BUY_VALIDATION_ERROR_MAXIMUM_FIAT"
                                    values={{
                                        maximum: amountLimits.maxFiat,
                                        currency: amountLimits.currency,
                                    }}
                                />
                            );
                        }
                    }
                }
            },
        }),
        [activeInput, amountLimits, formState.isSubmitting],
    );

    const cryptoInputRules = useMemo<TypedValidationRules>(
        () => ({
            validate: (value: string) => {
                if (activeInput === cryptoInput) {
                    if (!value) {
                        if (formState.isSubmitting) {
                            return <Translation id="TR_BUY_VALIDATION_ERROR_EMPTY" />;
                        }

                        return;
                    }

                    const amountBig = new Bignumber(value);

                    if (amountBig.isNaN()) {
                        return <Translation id="AMOUNT_IS_NOT_NUMBER" />;
                    }

                    if (shouldSendInSats && !isInteger(value)) {
                        return 'AMOUNT_IS_NOT_INTEGER';
                    }

                    if (amountBig.lte(0)) {
                        return <Translation id="AMOUNT_IS_TOO_LOW" />;
                    }

                    if (!isDecimalsValid(value, network.decimals)) {
                        return (
                            <Translation
                                id="AMOUNT_IS_NOT_IN_RANGE_DECIMALS"
                                values={{ decimals: network.decimals }}
                            />
                        );
                    }

                    if (amountLimits) {
                        const amount = Number(value);

                        let minCrypto = 0;
                        if (amountLimits.minCrypto) {
                            minCrypto = shouldSendInSats
                                ? Number(
                                      amountToSatoshi(
                                          amountLimits.minCrypto.toString(),
                                          network.decimals,
                                      ),
                                  )
                                : amountLimits.minCrypto;
                        }
                        if (minCrypto && amount < minCrypto) {
                            return (
                                <Translation
                                    id="TR_BUY_VALIDATION_ERROR_MINIMUM_CRYPTO"
                                    values={{
                                        minimum: (
                                            <FormattedCryptoAmount
                                                value={amountLimits.minCrypto}
                                                symbol={amountLimits.currency}
                                            />
                                        ),
                                    }}
                                />
                            );
                        }

                        let maxCrypto = 0;
                        if (amountLimits.maxCrypto) {
                            maxCrypto = shouldSendInSats
                                ? Number(
                                      amountToSatoshi(
                                          amountLimits.maxCrypto.toString(),
                                          network.decimals,
                                      ),
                                  )
                                : amountLimits.maxCrypto;
                        }
                        if (maxCrypto && amount > maxCrypto) {
                            return (
                                <Translation
                                    id="TR_BUY_VALIDATION_ERROR_MAXIMUM_CRYPTO"
                                    values={{
                                        maximum: (
                                            <FormattedCryptoAmount
                                                value={amountLimits.maxCrypto}
                                                symbol={amountLimits.currency}
                                            />
                                        ),
                                    }}
                                />
                            );
                        }
                    }
                }
            },
        }),
        [activeInput, amountLimits, formState.isSubmitting, network.decimals, shouldSendInSats],
    );

    return (
        <Wrapper responsiveSize="LG">
            <Left>
                <NumberInput
                    control={control}
                    noTopLabel
                    rules={fiatInputRules}
                    onFocus={() => {
                        setActiveInput(fiatInput);
                    }}
                    onChange={() => {
                        setActiveInput(fiatInput);
                        setValue(cryptoInput, '');
                        clearErrors(cryptoInput);
                    }}
                    inputState={getInputState(errors.fiatInput, fiatInputValue)}
                    name={fiatInput}
                    maxLength={MAX_LENGTH.AMOUNT}
                    bottomText={<InputError error={errors[fiatInput]} />}
                    innerAddon={
                        <Controller
                            control={control}
                            name={currencySelect}
                            defaultValue={defaultCurrency}
                            render={({ onChange, value }) => (
                                <Select
                                    options={FIAT.currencies
                                        .filter(c => buyInfo?.supportedFiatCurrencies.has(c))
                                        .map((currency: string) => buildOption(currency))}
                                    isSearchable
                                    data-test="@coinmarket/buy/fiat-currency-select"
                                    value={value}
                                    isClearable={false}
                                    minWidth="58px"
                                    isClean
                                    hideTextCursor
                                    onChange={(selected: any) => {
                                        onChange(selected);
                                        setAmountLimits(undefined);
                                    }}
                                />
                            )}
                        />
                    }
                    data-test="@coinmarket/buy/fiat-input"
                />
            </Left>
            <Middle responsiveSize="LG">
                <StyledIcon responsiveSize="LG" icon="TRANSFER" size={16} />
            </Middle>
            <Right>
                <NumberInput
                    control={control}
                    onFocus={() => {
                        setActiveInput(cryptoInput);
                    }}
                    onChange={() => {
                        setValue(fiatInput, '');
                        clearErrors(fiatInput);
                    }}
                    inputState={getInputState(errors.cryptoInput, cryptoInputValue)}
                    name={cryptoInput}
                    noTopLabel
                    maxLength={MAX_LENGTH.AMOUNT}
                    rules={cryptoInputRules}
                    bottomText={<InputError error={errors[cryptoInput]} />}
                    innerAddon={
                        <Controller
                            control={control}
                            name={cryptoSelect}
                            defaultValue={{
                                value: uppercaseSymbol,
                                label: uppercaseSymbol,
                            }}
                            render={({ onChange, value }) => (
                                <Select
                                    onChange={(selected: any) => {
                                        onChange(selected);
                                    }}
                                    value={value}
                                    isSearchable
                                    isClearable={false}
                                    data-test="@coinmarket/buy/crypto-currency-select"
                                    options={getCryptoOptions(
                                        account.symbol,
                                        account.networkType,
                                        buyInfo?.supportedCryptoCurrencies || new Set(),
                                        exchangeCoinInfo,
                                    )}
                                    formatOptionLabel={(option: any) => (
                                        <Option>
                                            {account.symbol.toUpperCase() === option.value ? (
                                                <CoinLogo size={18} symbol={account.symbol} />
                                            ) : (
                                                <TokenLogo
                                                    src={`${invityAPI.getApiServerUrl()}/images/coins/suite/${
                                                        option.value
                                                    }.svg`}
                                                />
                                            )}
                                            <Label>{shouldSendInSats ? 'sat' : option.label}</Label>
                                        </Option>
                                    )}
                                    isClean
                                    hideTextCursor
                                    isDisabled={account.networkType !== 'ethereum'}
                                    minWidth="100px"
                                />
                            )}
                        />
                    }
                    data-test="@coinmarket/buy/crypto-input"
                />
            </Right>
        </Wrapper>
    );
};

export default Inputs;
