import React, { useEffect, useState } from 'react';
import Bignumber from 'bignumber.js';
import { Controller } from 'react-hook-form';
import { FIAT } from '@suite-config';
import { Translation } from '@suite-components';
import { getCryptoOptions } from '@wallet-utils/coinmarket/buyUtils';
import { Select, Input } from '@trezor/components';
import { buildOption } from '@wallet-utils/coinmarket/coinmarketUtils';
import { useCoinmarketBuyFormContext } from '@wallet-hooks/useCoinmarketBuyForm';
import { isDecimalsValid } from '@wallet-utils/validation';
import { InputError } from '@wallet-components';
import { MAX_LENGTH } from '@suite-constants/inputs';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { Wrapper, Left, Middle, Right, StyledIcon } from '@wallet-views/coinmarket';

const Inputs = () => {
    const {
        register,
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
    } = useCoinmarketBuyFormContext();
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

    return (
        <Wrapper responsiveSize="LG">
            <Left>
                <Input
                    noTopLabel
                    innerRef={register({
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
                    })}
                    onFocus={() => {
                        setActiveInput(fiatInput);
                    }}
                    onChange={() => {
                        setActiveInput(fiatInput);
                        setValue(cryptoInput, '');
                        clearErrors(cryptoInput);
                    }}
                    state={getInputState(errors.fiatInput, fiatInputValue)}
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
                />
            </Left>
            <Middle responsiveSize="LG">
                <StyledIcon responsiveSize="LG" icon="TRANSFER" size={16} />
            </Middle>
            <Right>
                <Input
                    onFocus={() => {
                        setActiveInput(cryptoInput);
                    }}
                    onChange={() => {
                        setValue(fiatInput, '');
                        clearErrors(fiatInput);
                    }}
                    state={getInputState(errors.cryptoInput, cryptoInputValue)}
                    name={cryptoInput}
                    noTopLabel
                    maxLength={MAX_LENGTH.AMOUNT}
                    innerRef={register({
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
                                    if (amountLimits.minCrypto && amount < amountLimits.minCrypto) {
                                        return (
                                            <Translation
                                                id="TR_BUY_VALIDATION_ERROR_MINIMUM_CRYPTO"
                                                values={{
                                                    minimum: amountLimits.minCrypto,
                                                    currency: amountLimits.currency,
                                                }}
                                            />
                                        );
                                    }
                                    if (amountLimits.maxCrypto && amount > amountLimits.maxCrypto) {
                                        return (
                                            <Translation
                                                id="TR_BUY_VALIDATION_ERROR_MAXIMUM_CRYPTO"
                                                values={{
                                                    maximum: amountLimits.maxCrypto,
                                                    currency: amountLimits.currency,
                                                }}
                                            />
                                        );
                                    }
                                }
                            }
                        },
                    })}
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
                                    options={getCryptoOptions(account.symbol, account.networkType)}
                                    isClean
                                    hideTextCursor
                                    isDropdownVisible={account.networkType === 'ethereum'}
                                    isDisabled={account.networkType !== 'ethereum'}
                                    minWidth="58px"
                                />
                            )}
                        />
                    }
                />
            </Right>
        </Wrapper>
    );
};

export default Inputs;
