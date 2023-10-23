import styled from 'styled-components';

import { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import { Button, variables, Select, Flag } from '@trezor/components';
import { useSavingsSetup } from 'src/hooks/wallet/useCoinmarketSavingsSetup';
import { Controller } from 'react-hook-form';
import { Translation } from 'src/components/suite';
import regional from 'src/constants/wallet/coinmarket/regional';
import type { CountryOption } from 'src/types/wallet/coinmarketCommonTypes';
import { getCountryLabelParts } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import FiatAmount from './components/FiatAmount';
import Summary from './components/Summary';
import { NoProviders, StyledSelectBar } from 'src/views/wallet/coinmarket';
import { getTitleForNetwork } from '@suite-common/wallet-utils';
import { AllFeesIncluded } from '../AllFeesIncluded';
import { withCoinmarket } from '../withCoinmarket';

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
    margin-bottom: 32px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const Label = styled.div`
    padding-right: 20px;
    display: flex;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-transform: capitalize;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
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
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

const LinkButton = styled(Button)`
    background: none !important;
    border: none;
    padding: 0 !important;
    cursor: pointer;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    display: inline;
    align-items: center;
    text-decoration: underline;

    :hover {
        opacity: 0.8;
    }
`;

const ConfirmButton = styled(Button)`
    margin: 42px auto 0;
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
        account,
        formState: { errors },
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
                render={({ field: { onChange, value } }) => (
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
                        minValueWidth="160px"
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
                        render={({ field: { onChange, value } }) => (
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
                        fiatAmount={fiatAmount}
                        fiatCurrency={fiatCurrency}
                    />

                    <AllFeesIncluded />

                    <Summary
                        accountSymbol={account.symbol}
                        annualSavingsCryptoAmount={annualSavingsCryptoAmount}
                        annualSavingsFiatAmount={annualSavingsFiatAmount}
                        fiatCurrency={fiatCurrency}
                    />

                    <ConfirmButton isDisabled={!canConfirmSetup} isLoading={isSubmitting}>
                        <Translation id="TR_SAVINGS_SETUP_CONFIRM_BUTTON" />
                    </ConfirmButton>
                </>
            )}
        </form>
    );
};

export default withCoinmarket(CoinmarketSavingsSetup, {
    title: 'TR_NAV_INVITY',
});
