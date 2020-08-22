import { Translation } from '@suite-components';
import { FIAT } from '@suite-config';
import { useSelector } from '@suite-hooks';
import { CleanSelect, CoinLogo, Icon, Input, variables } from '@trezor/components';
import { getTitleForNetwork } from '@wallet-utils/accountUtils';
import { AmountLimits, buildOption } from '@wallet-utils/coinmarket/buyUtils';
import React, { useEffect, useState } from 'react';
import { BuyInfo } from '@wallet-actions/coinmarketBuyActions';
import { useFormContext, Controller } from 'react-hook-form';
import styled from 'styled-components';
import validator from 'validator';

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

const StyledCoinLogo = styled(CoinLogo)`
    margin-right: 5px;
`;

const StyledIcon = styled(Icon)`
    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        transform: rotate(90deg);
    }
`;

const AddonText = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface Props {
    amountLimits?: AmountLimits;
    buyInfo: BuyInfo;
    setAmountLimits: (amountLimits: AmountLimits | undefined) => void;
}

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

    const [activeInput, setActiveInput] = useState<'fiatInput' | 'cryptoInput'>(fiatInput);

    useEffect(() => {
        trigger([fiatInput]);
    }, [amountLimits, trigger]);

    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    if (selectedAccount.status !== 'loaded') {
        return null;
    }

    const { account } = selectedAccount;
    const defaultCurrencyInfo = buyInfo.buyInfo?.suggestedFiatCurrency;
    const defaultCurrency = defaultCurrencyInfo
        ? buildOption(defaultCurrencyInfo)
        : { label: 'USD', value: 'usd' };

    return (
        <Wrapper>
            <Left>
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
                            name={currencySelect}
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
                        <>
                            <StyledCoinLogo size={18} symbol={account.symbol} />
                            <AddonText>
                                <Translation {...getTitleForNetwork(account.symbol)} />
                            </AddonText>
                        </>
                    }
                />
            </Right>
        </Wrapper>
    );
};

export default Inputs;
