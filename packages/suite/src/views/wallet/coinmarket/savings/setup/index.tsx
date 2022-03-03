import React from 'react';
import { InputError, withInvityLayout, WithSelectedAccountLoadedProps } from '@wallet-components';
import styled from 'styled-components';
import KYCInProgress from '@wallet-components/KYCInProgress';
import { Button, Input, SelectBar, variables } from '@trezor/components';
import { useSavingsSetup } from '@wallet-hooks/coinmarket/savings/useSavingsSetup';
import { Controller } from 'react-hook-form';
import { FormattedCryptoAmount, FormattedNumber, Translation } from '@suite-components';
import AddressOptions from '../../common/AddressOptions';

const Header = styled.div`
    font-weight: 500;
    font-size: 24px;
    line-height: 30px;
    margin-bottom: 35px;
`;

const Label = styled.div`
    padding-right: 20px;
    display: flex;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-transform: capitalize;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    margin-bottom: 11px;
`;

const StyledSelectBar = styled(SelectBar)`
    width: 100%;
    & div div {
        justify-content: center;
    }
`;

const FrequencyStyledSelectBar = styled(StyledSelectBar)`
    margin-bottom: 26px;
`;

const Summary = styled.div`
    display: flex;
    justify-content: space-between;
    border-top: 1px solid ${props => props.theme.BG_GREY};
    border-bottom: 1px solid ${props => props.theme.BG_GREY};
    margin: 15px 0;
    padding: 15px 0;
`;

const Left = styled.div`
    display: flex;
    font-size: 16px;
    line-height: 24px;
    align-items: center;
`;

const Right = styled.div`
    display: flex;
    flex-direction: column;
`;

const Fiat = styled.div`
    font-size: 20px;
    line-height: 28px;
    color: ${props => props.theme.TYPE_GREEN};
    justify-content: end;
    display: flex;
`;

const FiatAmount = styled.div`
    display: flex;
`;

const FiatAmountLeftColumn = styled.div`
    display: flex;
    flex: 1;
    flex-direction: row;
`;

const FiatAmountRightColumn = styled.div`
    display: flex;
    justify-content: flex-end;
    flex-direction: row;
`;

const Crypto = styled.div`
    font-size: 20px;
    line-height: 28px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    justify-content: end;
    display: flex;
`;

const StyledInput = styled(Input)`
    display: flex;
    max-width: 70px;
    width: 70px;
`;

const CustomAmountInputErrorWrapper = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_RED};
    align-items: end;
    padding: 10px 10px 0 10px;
    min-height: 27px;
    justify-content: end;
`;

const AddressOptionsWrapper = styled.div`
    margin-bottom: 16px;
`;

const getFiatAmountOptions = (amounts: string[], fiatCurrency?: string) =>
    amounts.map(amount => ({
        label: !Number.isNaN(Number(amount)) ? (
            <FormattedNumber
                value={amount}
                currency={fiatCurrency}
                minimumFractionDigits={0}
                maximumFractionDigits={0}
            />
        ) : (
            amount
        ),
        value: amount,
    }));

const CoinmarketSavingsSetup = (props: WithSelectedAccountLoadedProps) => {
    const {
        control,
        defaultFiatAmount,
        defaultPaymentFrequency,
        annualSavingsCalculationFiat,
        annualSavingsCalculationCrypto,
        fiatAmount,
        fiatCurrency,
        register,
        errors,
        isWatchingKYCStatus,
        canConfirmSetup,
        account,
        setValue,
        address,
        handleSubmit,
        onSubmit,
        isSubmitting,
        paymentAmounts,
        paymentFrequencyOptions,
        minimumPaymentAmountLimit,
        maximumPaymentAmountLimit,
    } = useSavingsSetup(props);

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            {isWatchingKYCStatus && <KYCInProgress />}
            <Header>
                <Translation id="TR_SAVINGS_SETUP_HEADER" />
            </Header>
            <Label>
                <Translation id="TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_LABEL" />
            </Label>
            <Controller
                control={control}
                name="paymentFrequency"
                defaultValue={defaultPaymentFrequency}
                render={({ onChange, value }) => (
                    <FrequencyStyledSelectBar
                        onChange={onChange}
                        selectedOption={value}
                        options={paymentFrequencyOptions}
                    />
                )}
            />
            <Label>
                <Translation id="TR_SAVINGS_SETUP_FIAT_AMOUNT_LABEL" />
            </Label>
            <FiatAmount>
                <FiatAmountLeftColumn>
                    <Controller
                        control={control}
                        name="fiatAmount"
                        defaultValue={defaultFiatAmount}
                        render={({ onChange, value }) => (
                            <StyledSelectBar
                                onChange={onChange}
                                selectedOption={value}
                                options={getFiatAmountOptions(paymentAmounts, fiatCurrency)}
                            />
                        )}
                    />
                </FiatAmountLeftColumn>
                {fiatAmount === 'Custom' && (
                    <FiatAmountRightColumn>
                        <StyledInput
                            name="customFiatAmount"
                            monospace
                            width={70}
                            noTopLabel
                            variant="small"
                            noError
                            state={errors.customFiatAmount ? 'error' : 'success'}
                            innerRef={register({
                                validate: (value: string) => {
                                    if (!value) {
                                        return 'TR_SAVINGS_SETUP_CUSTOM_FIAT_AMOUNT_REQUIRED';
                                    }
                                    if (Number.isNaN(Number(value))) {
                                        return 'TR_SAVINGS_SETUP_CUSTOM_FIAT_AMOUNT_INVALID_FORMAT';
                                    }
                                    const numberValue = Number(value);
                                    if (
                                        minimumPaymentAmountLimit &&
                                        numberValue < minimumPaymentAmountLimit
                                    ) {
                                        return (
                                            <Translation
                                                id="TR_SAVINGS_SETUP_CUSTOM_FIAT_AMOUNT_MINIMUM"
                                                values={{
                                                    amount: minimumPaymentAmountLimit,
                                                }}
                                            />
                                        );
                                    }
                                    if (
                                        maximumPaymentAmountLimit &&
                                        numberValue > maximumPaymentAmountLimit
                                    ) {
                                        return (
                                            <Translation
                                                id="TR_SAVINGS_SETUP_CUSTOM_FIAT_AMOUNT_MAXIMUM"
                                                values={{
                                                    amount: maximumPaymentAmountLimit,
                                                }}
                                            />
                                        );
                                    }
                                },
                            })}
                        />
                    </FiatAmountRightColumn>
                )}
            </FiatAmount>
            <CustomAmountInputErrorWrapper>
                <InputError error={errors.customFiatAmount} />
            </CustomAmountInputErrorWrapper>
            <Summary>
                <Left>
                    <Translation id="TR_SAVINGS_SETUP_SUMMARY_LABEL" />
                </Left>
                <Right>
                    <Fiat>
                        <FormattedNumber currency="EUR" value={annualSavingsCalculationFiat} />
                    </Fiat>
                    <Crypto>
                        ≈&nbsp;
                        <FormattedCryptoAmount
                            value={annualSavingsCalculationCrypto}
                            symbol="btc"
                        />
                    </Crypto>
                </Right>
            </Summary>
            <Label>
                <Translation id="TR_SAVINGS_SETUP_RECEIVING_ADDRESS" />
            </Label>
            <AddressOptionsWrapper>
                <AddressOptions
                    account={account}
                    control={control}
                    receiveSymbol={account.symbol}
                    setValue={setValue}
                    address={address}
                    menuPlacement="auto"
                />
            </AddressOptionsWrapper>
            <Button isDisabled={!canConfirmSetup} isLoading={isSubmitting}>
                <Translation id="TR_SAVINGS_SETUP_CONFIRM_BUTTON" />
            </Button>
        </form>
    );
};
export default withInvityLayout(CoinmarketSavingsSetup, {
    showStepsGuide: true,
});
