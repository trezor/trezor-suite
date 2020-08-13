import { Translation } from '@suite-components';
import { FIAT } from '@suite-config';
import { useSelector } from '@suite-hooks';
import { CleanSelect, CoinLogo, Icon, Input } from '@trezor/components';
import { getTitleForNetwork } from '@wallet-utils/accountUtils';
import { AmountLimits, buildOption } from '@wallet-utils/coinmarket/buyUtils';
import React, { useEffect } from 'react';
import { BuyInfo } from '@wallet-actions/coinmarketBuyActions';
import { useFormContext, Controller } from 'react-hook-form';
import styled from 'styled-components';
import validator from 'validator';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: space-between;
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
`;

const StyledCoinLogo = styled(CoinLogo)`
    margin-right: 5px;
`;

interface Props {
    amountLimits?: AmountLimits;
    buyInfo: BuyInfo;
    setAmountLimits: (amountLimits: AmountLimits | undefined) => void;
}

const Inputs = ({ amountLimits, buyInfo, setAmountLimits }: Props) => {
    const { register, errors, trigger, control, getValues } = useFormContext();
    const fiatInput = 'fiatInput';
    const currencySelect = 'currencySelect';

    // when the limits change, trigger revalidation
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
        : {
              label: 'USD',
              value: 'usd',
          };

    return (
        <Wrapper>
            <Left>
                <Input
                    noTopLabel
                    defaultValue="10000"
                    innerRef={register({
                        validate: value => {
                            if (!value) {
                                return 'TR_ERROR_EMPTY';
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
                        },
                    })}
                    state={errors[fiatInput] ? 'error' : undefined}
                    name={fiatInput}
                    bottomText={errors[fiatInput] && errors[fiatInput].message}
                    innerAddon={
                        <Controller
                            control={control}
                            name={currencySelect}
                            defaultValue={defaultCurrency}
                            render={({ onChange, value }) => {
                                console.log(getValues());
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
                <Icon icon="TRANSFER" size={16} />
            </Middle>
            <Right>
                <Input
                    noTopLabel
                    innerAddon={
                        <>
                            <StyledCoinLogo size={18} symbol={account.symbol} />
                            <Translation {...getTitleForNetwork(account.symbol)} />
                        </>
                    }
                />
            </Right>
        </Wrapper>
    );
};

export default Inputs;
