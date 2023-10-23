import { Controller } from 'react-hook-form';
import styled from 'styled-components';
import { Button, Select, variables, Flag } from '@trezor/components';
import regional from 'src/constants/wallet/coinmarket/regional';
import { useCoinmarketBuyFormContext } from 'src/hooks/wallet/useCoinmarketBuyForm';
import { getCountryLabelParts } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CountryOption } from 'src/types/wallet/coinmarketCommonTypes';
import { Translation } from 'src/components/suite';
import { FooterWrapper, Left, Right } from 'src/views/wallet/coinmarket';

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

const StyledRight = styled(Right)`
    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        justify-content: flex-start;
    }
`;

const Label = styled.div`
    display: flex;
    align-items: center;
    white-space: nowrap;
    padding-top: 1px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledButton = styled(Button)`
    display: flex;
    min-width: 200px;
    margin-top: 0;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        margin-top: 20px;
        width: 100%;
    }
`;

const StyledSelect = styled(Select)`
    width: max-content;
`;

const Footer = () => {
    const { control, formState, watch, setAmountLimits, defaultCountry } =
        useCoinmarketBuyFormContext();
    const countrySelect = 'countrySelect';
    const hasValues =
        (watch('fiatInput') || watch('cryptoInput')) && !!watch('currencySelect').value;
    // used instead of formState.isValid, which is sometimes returning false even if there are no errors
    const formIsValid = Object.keys(formState.errors).length === 0;

    return (
        <FooterWrapper>
            <Left>
                <Label>
                    <Translation id="TR_BUY_OFFERS_FOR" />
                </Label>
                <Controller
                    control={control}
                    defaultValue={defaultCountry}
                    name={countrySelect}
                    render={({ field: { onChange, value } }) => (
                        <StyledSelect
                            data-test="@coinmarket/buy/country-select"
                            options={regional.countriesOptions}
                            isSearchable
                            value={value}
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
                            isClean
                            onChange={(selected: any) => {
                                onChange(selected);
                                setAmountLimits(undefined);
                            }}
                        />
                    )}
                />
            </Left>
            <StyledRight>
                <StyledButton
                    isDisabled={!(formIsValid && hasValues) || formState.isSubmitting}
                    isLoading={formState.isSubmitting}
                    type="submit"
                    data-test="@coinmarket/buy/compare-button"
                >
                    <Translation id="TR_BUY_SHOW_OFFERS" />
                </StyledButton>
            </StyledRight>
        </FooterWrapper>
    );
};

export default Footer;
