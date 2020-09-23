// import { FIAT } from '@suite-config';
import { useSelector } from '@suite-hooks';
import { Account } from '@wallet-types';
import { CleanSelect, Icon, Input, variables, Select } from '@trezor/components';
// import { buildOption } from '@wallet-utils/coinmarket/coinmarketUtils';
import React, { useEffect, useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import styled from 'styled-components';
import validator from 'validator';
import { ExchangeInfo } from '@suite/actions/wallet/coinmarketExchangeActions';
import { AmountLimits } from '@suite/utils/wallet/coinmarket/exchangeUtils';
import { symbolToInvityApiSymbol } from '@suite/utils/wallet/coinmarket/coinmarketUtils';

interface Props {
    amountLimits?: AmountLimits;
    exchangeInfo?: ExchangeInfo;
    setAmountLimits: (amountLimits: AmountLimits | undefined) => void;
}

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

const getSellCryptoOptions = (account: Account, exchangeInfo?: ExchangeInfo) => {
    const uppercaseSymbol = account.symbol.toUpperCase();
    const options: { value: string; label: string }[] = [
        { value: uppercaseSymbol, label: uppercaseSymbol },
    ];

    if (account.networkType === 'ethereum' && account.tokens) {
        account.tokens.forEach(token => {
            if (token.symbol) {
                const invityToken = symbolToInvityApiSymbol(token.symbol);
                if (exchangeInfo?.sellSymbols.has(invityToken)) {
                    options.push({
                        label: token.symbol.toUpperCase(),
                        value: invityToken.toUpperCase(),
                    });
                }
            }
        });
    }

    return options;
};

// TODO - split by supported and unsupported, sort and probably add coin name
const getBuyCryptoOptions = (account: Account, exchangeInfo?: ExchangeInfo) => {
    const options: { value: string; label: string }[] = [];

    if (!exchangeInfo) return null;

    exchangeInfo.buySymbols.forEach(token => {
        if (account.symbol !== token) {
            const invityToken = symbolToInvityApiSymbol(token);
            options.push({
                label: token.toUpperCase(),
                value: invityToken.toUpperCase(),
            });
        }
    });

    return options;
};

const Inputs = ({ amountLimits, exchangeInfo, setAmountLimits }: Props) => {
    const {
        register,
        errors,
        trigger,
        control,
        // setValue,
        // clearErrors,
        formState,
    } = useFormContext();
    const cryptoInput = 'cryptoInput';
    const sellCryptoSelect = 'sellCryptoSelect';
    // const fiatInput = 'fiatInput';
    const buyCryptoSelect = 'buyCryptoSelect';

    const [activeInput, setActiveInput] = useState<'fiatInput' | 'cryptoInput'>(cryptoInput);

    useEffect(() => {
        trigger([cryptoInput]);
    }, [amountLimits, trigger]);

    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    if (selectedAccount.status !== 'loaded') {
        return null;
    }

    const { account } = selectedAccount;
    const uppercaseSymbol = account.symbol.toUpperCase();

    return (
        <>
            <Wrapper>
                <Left>
                    <Input
                        onFocus={() => {
                            setActiveInput(cryptoInput);
                            // setValue(fiatInput, '');
                            // clearErrors(fiatInput);
                            trigger([cryptoInput]);
                        }}
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
                                        if (amountLimits.min && amount < amountLimits.min) {
                                            return `Minimum is ${amountLimits.min} ${amountLimits.currency}`;
                                        }
                                        if (amountLimits.max && amount > amountLimits.max) {
                                            return `Maximum is ${amountLimits.max} ${amountLimits.currency}`;
                                        }
                                    }
                                }
                            },
                        })}
                        bottomText={errors[cryptoInput] && errors[cryptoInput].message}
                        innerAddon={
                            <Controller
                                control={control}
                                name={sellCryptoSelect}
                                defaultValue={{
                                    value: uppercaseSymbol,
                                    label: uppercaseSymbol,
                                }}
                                render={({ onChange, value }) => {
                                    return (
                                        <CleanSelect
                                            onChange={(selected: any) => {
                                                onChange(selected);
                                                setAmountLimits(undefined);
                                            }}
                                            value={value}
                                            isClearable={false}
                                            options={getSellCryptoOptions(account, exchangeInfo)}
                                            isDropdownVisible={account.networkType === 'ethereum'}
                                            isDisabled={account.networkType !== 'ethereum'}
                                            minWidth="70px"
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
                    {/* 
                
                TODO - after new desing + merge of new send, add a possibility to enter the amount in fiat
                
                <Input
                    noTopLabel
                    defaultValue=""
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
                            name={buyCryptoSelect}
                            defaultValue={defaultCurrency}
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
                /> */}
                </Right>
            </Wrapper>
            <Wrapper>
                <Left>
                    <Controller
                        control={control}
                        name={buyCryptoSelect}
                        render={({ onChange, value }) => {
                            return (
                                <Select
                                    onChange={(selected: any) => {
                                        onChange(selected);
                                        setAmountLimits(undefined);
                                    }}
                                    value={value}
                                    isClearable={false}
                                    options={getBuyCryptoOptions(account, exchangeInfo)}
                                    minWidth="70px"
                                />
                            );
                        }}
                    />
                </Left>
                <Middle />
                <Right />
            </Wrapper>
        </>
    );
};

export default Inputs;
