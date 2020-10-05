import { FIAT } from '@suite-config';
import { Translation } from '@suite-components';
import { getCryptoOptions } from '@wallet-utils/coinmarket/buyUtils';
import { CleanSelect, Icon, Input, variables } from '@trezor/components';
import { buildOption } from '@wallet-utils/coinmarket/coinmarketUtils';
import React, { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { useCoinmarketBuyFormContext } from '@wallet-hooks/useCoinmarketBuyForm';
import styled from 'styled-components';
import { isDecimalsValid } from '@wallet-utils/validation';
import { InputError } from '@wallet-components';

const Wrapper = styled.div`
    display: flex;
    flex: 1;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex-direction: column;
    }
`;

const Left = styled.div`
    display: flex;
    flex: 1;
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-end;
`;

const Middle = styled.div`
    display: flex;
    min-width: 65px;
    height: 48px;
    align-items: center;
    justify-content: center;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding-bottom: 27px;
    }
`;

const StyledIcon = styled(Icon)`
    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        transform: rotate(90deg);
    }
`;

const Inputs = () => {
    const {
        register,
        errors,
        trigger,
        watch,
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
        accountHasCachedRequest,
        quotesRequest,
    } = useCoinmarketBuyFormContext();
    const { symbol } = account;
    const uppercaseSymbol = symbol.toUpperCase();
    const fiatInput = 'fiatInput';
    const cryptoInput = 'cryptoInput';
    const currencySelect = 'currencySelect';
    const cryptoSelect = 'cryptoSelect';

    const [activeInput, setActiveInput] = useState<'fiatInput' | 'cryptoInput'>(fiatInput);
    // if cryptoInput has a valid value, set it as the activeInput
    if (watch('cryptoInput') && !errors[cryptoInput] && activeInput === fiatInput) {
        setActiveInput(cryptoInput);
    }

    useEffect(() => {
        trigger([activeInput]);
    }, [activeInput, amountLimits, trigger]);

    return (
        <Wrapper>
            <Left>
                <Input
                    noTopLabel
                    defaultValue={
                        accountHasCachedRequest && quotesRequest
                            ? quotesRequest.fiatStringAmount
                            : ''
                    }
                    innerRef={register({
                        validate: (value: string) => {
                            if (activeInput === fiatInput) {
                                if (!value) {
                                    if (formState.isSubmitting) {
                                        return <Translation id="TR_BUY_VALIDATION_ERROR_EMPTY" />;
                                    }
                                    return;
                                }

                                if (!isDecimalsValid(value, 2)) {
                                    return <Translation id="TR_BUY_VALIDATION_ERROR_NOT_NUMBER" />;
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
                        setValue(cryptoInput, '');
                        clearErrors(cryptoInput);
                    }}
                    state={errors[fiatInput] ? 'error' : undefined}
                    name={fiatInput}
                    bottomText={<InputError error={errors[fiatInput]} />}
                    innerAddon={
                        <Controller
                            control={control}
                            name={currencySelect}
                            defaultValue={
                                accountHasCachedRequest && quotesRequest?.fiatCurrency
                                    ? {
                                          label: quotesRequest.fiatCurrency.toUpperCase(),
                                          value: quotesRequest.fiatCurrency.toUpperCase(),
                                      }
                                    : defaultCurrency
                            }
                            render={({ onChange, value }) => {
                                return (
                                    <CleanSelect
                                        options={FIAT.currencies
                                            .filter(c => buyInfo?.supportedFiatCurrencies.has(c))
                                            .map((currency: string) => buildOption(currency))}
                                        isSearchable
                                        value={value}
                                        isClearable={false}
                                        minWidth="45px"
                                        onChange={(selected: any) => {
                                            onChange(selected);
                                            setAmountLimits(undefined);
                                        }}
                                    />
                                );
                            }}
                        />
                    }
                />
            </Left>
            <Middle>
                <StyledIcon icon="TRANSFER" size={16} />
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
                    defaultValue={
                        accountHasCachedRequest && quotesRequest
                            ? quotesRequest.cryptoStringAmount
                            : ''
                    }
                    state={errors[cryptoInput] ? 'error' : undefined}
                    name={cryptoInput}
                    noTopLabel
                    innerRef={register({
                        validate: (value: string) => {
                            if (activeInput === cryptoInput) {
                                if (!value) {
                                    if (formState.isSubmitting) {
                                        return <Translation id="TR_BUY_VALIDATION_ERROR_EMPTY" />;
                                    }
                                    return;
                                }

                                if (!isDecimalsValid(value, network.decimals)) {
                                    return <Translation id="TR_BUY_VALIDATION_ERROR_NOT_NUMBER" />;
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
                            defaultValue={
                                accountHasCachedRequest && quotesRequest?.receiveCurrency
                                    ? {
                                          label: quotesRequest.receiveCurrency.toUpperCase(),
                                          value: quotesRequest.receiveCurrency.toUpperCase(),
                                      }
                                    : {
                                          value: uppercaseSymbol,
                                          label: uppercaseSymbol,
                                      }
                            }
                            render={({ onChange, value }) => {
                                return (
                                    <CleanSelect
                                        onChange={(selected: any) => {
                                            onChange(selected);
                                        }}
                                        value={value}
                                        isClearable={false}
                                        options={getCryptoOptions(
                                            account.symbol,
                                            account.networkType,
                                        )}
                                        isDropdownVisible={account.networkType === 'ethereum'}
                                        isDisabled={account.networkType !== 'ethereum'}
                                        minWidth="70px"
                                    />
                                );
                            }}
                        />
                    }
                />
            </Right>
        </Wrapper>
    );
};

export default Inputs;
