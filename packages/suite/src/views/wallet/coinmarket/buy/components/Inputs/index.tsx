import { FIAT } from '@suite-config';
import { useSelector } from '@suite-hooks';
import { Account } from '@wallet-types';
import { CleanSelect, Icon, Input, variables } from '@trezor/components';
import { AmountLimits } from '@wallet-utils/coinmarket/buyUtils';
import { buildOption, symbolToInvityApiSymbol } from '@wallet-utils/coinmarket/coinmarketUtils';
import React, { useEffect, useState } from 'react';
import { BuyInfo } from '@wallet-actions/coinmarketBuyActions';
import { useFormContext, Controller } from 'react-hook-form';
import styled from 'styled-components';
import validator from 'validator';

interface Props {
    amountLimits?: AmountLimits;
    buyInfo: BuyInfo;
    setAmountLimits: (amountLimits: AmountLimits | undefined) => void;
}

const getCryptoOptions = (account: Account) => {
    const supportedTokens = ['usdt', 'dai', 'gusd', 'ong'];
    const uppercaseSymbol = account.symbol.toUpperCase();
    const options: { value: string; label: string }[] = [
        { value: uppercaseSymbol, label: uppercaseSymbol },
    ];

    if (account.networkType === 'ethereum') {
        supportedTokens.forEach(token => {
            options.push({
                label: token.toUpperCase(),
                value: symbolToInvityApiSymbol(token).toUpperCase(),
            });
        });
    }

    return options;
};

const Inputs = ({ amountLimits, buyInfo, setAmountLimits }: Props) => {
    const {
        register,
        errors,
        trigger,
        control,
        setValue,
        clearErrors,
        formState,
    } = useFormContext();
    const fiatInput = 'fiatInput';
    const cryptoInput = 'cryptoInput';
    const currencySelect = 'currencySelect';
    const cryptoSelect = 'cryptoSelect';

    const [activeInput, setActiveInput] = useState<'fiatInput' | 'cryptoInput'>(fiatInput);
    const quotesRequest = useSelector(state => state.wallet.coinmarket.buy.quotesRequest);
    const cachedAccountInfo = useSelector(state => state.wallet.coinmarket.buy.cachedAccountInfo);

    useEffect(() => {
        trigger([fiatInput]);
    }, [amountLimits, trigger]);

    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    if (selectedAccount.status !== 'loaded') {
        return null;
    }

    const { account } = selectedAccount;

    const accountHasCachedRequest =
        account.symbol === cachedAccountInfo.symbol &&
        account.index === cachedAccountInfo.index &&
        account.accountType === cachedAccountInfo.accountType;

    const uppercaseSymbol = account.symbol.toUpperCase();
    const defaultCurrencyInfo = buyInfo.buyInfo?.suggestedFiatCurrency;
    const defaultCurrency = defaultCurrencyInfo
        ? buildOption(defaultCurrencyInfo)
        : { label: 'USD', value: 'usd' };

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
                        validate: value => {
                            if (activeInput === fiatInput) {
                                if (!value) {
                                    if (formState.isSubmitting) {
                                        return 'TR_ERROR_EMPTY';
                                    }
                                    return;
                                }

                                if (!validator.isNumeric(value)) {
                                    return 'TR_ERROR_NOT_NUMBER';
                                }

                                if (amountLimits) {
                                    const amount = Number(value);
                                    if (amountLimits.minFiat && amount < amountLimits.minFiat) {
                                        return `Minimum is ${amountLimits.minFiat} ${amountLimits.currency}`;
                                    }
                                    if (amountLimits.maxFiat && amount > amountLimits.maxFiat) {
                                        return `Maximum is ${amountLimits.maxFiat} ${amountLimits.currency}`;
                                    }
                                }
                            }
                        },
                    })}
                    onFocus={() => {
                        setActiveInput(fiatInput);
                        setValue(cryptoInput, '');
                        clearErrors(cryptoInput);
                        trigger([cryptoInput]);
                    }}
                    state={errors[fiatInput] ? 'error' : undefined}
                    name={fiatInput}
                    bottomText={errors[fiatInput] && errors[fiatInput].message}
                    innerAddon={
                        <Controller
                            control={control}
                            name={currencySelect}
                            defaultValue={
                                accountHasCachedRequest && quotesRequest
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
                                            .filter(c => buyInfo.supportedFiatCurrencies.has(c))
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
                        setValue(fiatInput, '');
                        clearErrors(fiatInput);
                        trigger([cryptoInput]);
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
                        validate: value => {
                            if (activeInput === cryptoInput) {
                                if (!value) {
                                    if (formState.isSubmitting) {
                                        return 'TR_ERROR_EMPTY';
                                    }
                                    return;
                                }

                                if (!validator.isNumeric(value)) {
                                    return 'TR_ERROR_NOT_NUMBER';
                                }

                                if (amountLimits) {
                                    const amount = Number(value);
                                    if (amountLimits.minCrypto && amount < amountLimits.minCrypto) {
                                        return `Minimum is ${amountLimits.minCrypto} ${amountLimits.currency}`;
                                    }
                                    if (amountLimits.maxCrypto && amount > amountLimits.maxCrypto) {
                                        return `Maximum is ${amountLimits.maxCrypto} ${amountLimits.currency}`;
                                    }
                                }
                            }
                        },
                    })}
                    bottomText={errors[cryptoInput] && errors[cryptoInput].message}
                    innerAddon={
                        <Controller
                            control={control}
                            name={cryptoSelect}
                            defaultValue={
                                accountHasCachedRequest && quotesRequest
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
                                        options={getCryptoOptions(account)}
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

export default Inputs;
