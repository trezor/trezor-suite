import React from 'react';
import { withCoinmarket, WithSelectedAccountLoadedProps } from '@wallet-components';
import styled from 'styled-components';
import { Button, variables, Select, Flag } from '@trezor/components';
import { useSavingsSetup } from '@wallet-hooks/useCoinmarketSavingsSetup';
import { Controller } from 'react-hook-form';
import { Translation } from '@suite-components';
import regional from '@wallet-constants/coinmarket/regional';
import type { CountryOption } from '@wallet-types/coinmarketCommonTypes';
import { getCountryLabelParts } from '@wallet-utils/coinmarket/coinmarketUtils';
import FiatAmount from './components/FiatAmount';
import Summary from './components/Summary';
import { NoProviders, StyledSelectBar } from '@wallet-views/coinmarket';
import { getTitleForNetwork } from '@suite-common/wallet-utils';

const Header = styled.div`
    font-weight: 500;
    font-size: 24px;
    line-height: 30px;
    margin-bottom: 16px;
`;

const CountryLocationDescription = styled.div`
    margin-bottom: 16px;
`;

const CountryMismatchDescription = styled.div`
    margin-bottom: 16px;
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

const FrequencyStyledSelectBar = styled(StyledSelectBar)`
    margin-bottom: 26px;
`;

const StyledSelect = styled(Select)`
    width: max-content;
    margin-bottom: 16px;
`;

const OptionLabel = styled.div`
    display: flex;
    align-items: center;
`;

const FlagWrapper = styled.div`
    padding-right: 10px;
`;

const LabelText = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const LinkButton = styled(Button)`
    background: none !important;
    border: none;
    padding: 0 !important;
    cursor: pointer;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: 500;
    display: inline;
    align-items: center;
    text-decoration: underline;
`;

const CoinmarketSavingsSetup = (props: WithSelectedAccountLoadedProps) => {
    const {
        control,
        defaultFiatAmount,
        defaultPaymentFrequency,
        annualSavingsCryptoAmount,
        annualSavingsFiatAmount,
        fiatAmount,
        fiatCurrency,
        register,
        account,
        errors,
        canConfirmSetup,
        handleSubmit,
        onSubmit,
        isSubmitting,
        paymentAmounts,
        paymentFrequencyOptions,
        minimumPaymentAmountLimit,
        maximumPaymentAmountLimit,
        supportedCountries,
        isProviderSelected,
        handleOneTimeBuyLinkButtonClick,
        isSavingsTradeLoading,
        noProviders,
        defaultCountryOption,
    } = useSavingsSetup(props);

    if (isSavingsTradeLoading) {
        return <Translation id="TR_LOADING" />;
    }

    if (noProviders) {
        return (
            <NoProviders>
                <Translation id="TR_SAVINGS_NO_PROVIDERS" />;
            </NoProviders>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Header>
                <Translation id="TR_SAVINGS_SETUP_HEADER" />
            </Header>
            <CountryLocationDescription>
                <Translation
                    id="TR_SAVINGS_SETUP_COUNTRY_LOCATION_DESCRIPTION"
                    values={{
                        cryptoCurrencyName: <Translation id={getTitleForNetwork(account.symbol)} />,
                    }}
                />
            </CountryLocationDescription>
            <Controller
                control={control}
                name="country"
                defaultValue={defaultCountryOption}
                render={({ onChange, value }) => (
                    <StyledSelect
                        value={value}
                        label={<Translation id="TR_SAVINGS_UNSUPPORTED_COUNTRY_SELECT_LABEL" />}
                        options={regional.countriesOptions.filter(item =>
                            supportedCountries?.has(item.value),
                        )}
                        isSearchable
                        formatOptionLabel={(option: CountryOption) => {
                            const labelParts = getCountryLabelParts(option.label);
                            if (!labelParts) return null;

                            return (
                                <OptionLabel>
                                    <FlagWrapper>
                                        <Flag country={option.value} />
                                    </FlagWrapper>
                                    <LabelText>{labelParts.text}</LabelText>
                                </OptionLabel>
                            );
                        }}
                        isClearable={false}
                        minWidth="160px"
                        hideTextCursor
                        onChange={onChange}
                    />
                )}
            />
            <CountryMismatchDescription>
                <Translation
                    id="TR_SAVINGS_SETUP_COUNTRY_MISMATCH_DESCRIPTION"
                    values={{
                        oneTimeBuyLink: (
                            <LinkButton onClick={handleOneTimeBuyLinkButtonClick}>
                                <Translation id="TR_SAVINGS_SETUP_ONE_TIME_BUY_LINK" />
                            </LinkButton>
                        ),
                    }}
                />
            </CountryMismatchDescription>
            {isProviderSelected && (
                <>
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
                    <FiatAmount
                        control={control}
                        customFiatAmountError={errors.customFiatAmount}
                        defaultFiatAmount={defaultFiatAmount}
                        maximumPaymentAmountLimit={maximumPaymentAmountLimit}
                        minimumPaymentAmountLimit={minimumPaymentAmountLimit}
                        paymentAmounts={paymentAmounts}
                        register={register}
                        fiatAmount={fiatAmount}
                        fiatCurrency={fiatCurrency}
                    />
                    <Summary
                        accountSymbol={account.symbol}
                        annualSavingsCryptoAmount={annualSavingsCryptoAmount}
                        annualSavingsFiatAmount={annualSavingsFiatAmount}
                        fiatCurrency={fiatCurrency}
                    />
                    <Button isDisabled={!canConfirmSetup} isLoading={isSubmitting}>
                        <Translation id="TR_SAVINGS_SETUP_CONFIRM_BUTTON" />
                    </Button>
                </>
            )}
        </form>
    );
};

export default withCoinmarket(CoinmarketSavingsSetup, {
    title: 'TR_NAV_INVITY',
});
