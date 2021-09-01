import React from 'react';
import { Controller } from 'react-hook-form';
import styled from 'styled-components';
import { Button, Select, variables, Flag } from '@trezor/components';
import regional from '@wallet-constants/coinmarket/regional';
import { useCoinmarketSellFormContext } from '@wallet-hooks/useCoinmarketSellForm';
import { getCountryLabelParts } from '@wallet-utils/coinmarket/coinmarketUtils';
import { Translation } from '@suite-components';

import { CountryOption } from '@wallet-types/coinmarketCommonTypes';
import { FooterWrapper, Left, Right } from '@wallet-views/coinmarket';

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
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledButton = styled(Button)`
    display: flex;
    min-width: 200px;
    margin-left: 20px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin-top: 20px;
        margin-left: 0;
        width: 100%;
    }
`;

const StyledSelect = styled(Select)`
    width: max-content;
`;

const Footer = () => {
    const {
        errors,
        control,
        formState,
        watch,
        setAmountLimits,
        defaultCountry,
        quotesRequest,
        isComposing,
    } = useCoinmarketSellFormContext();
    const countrySelect = 'countrySelect';
    const hasValues =
        (watch('fiatInput') || watch('cryptoInput')) && !!watch('fiatCurrencySelect').value;
    // used instead of formState.isValid, which is sometimes returning false even if there are no errors
    const formIsValid = Object.keys(errors).length === 0;

    return (
        <FooterWrapper>
            <Left>
                <Label>
                    <Translation id="TR_SELL_OFFERS_FOR" />
                </Label>
                <Controller
                    control={control}
                    defaultValue={
                        quotesRequest?.country
                            ? {
                                  label: regional.countriesMap.get(quotesRequest.country),
                                  value: quotesRequest.country,
                              }
                            : defaultCountry
                    }
                    name={countrySelect}
                    render={({ onChange, value }) => (
                        <StyledSelect
                            noTopLabel
                            isDropdownVisible
                            isHovered
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
                            minWidth="160px"
                            isClean
                            hideTextCursor
                            onChange={(selected: any) => {
                                onChange(selected);
                                setAmountLimits(undefined);
                            }}
                            maxSearchLength={12}
                        />
                    )}
                />
            </Left>
            <StyledRight>
                <StyledButton
                    isDisabled={!(formIsValid && hasValues) || formState.isSubmitting}
                    isLoading={formState.isSubmitting || isComposing}
                    type="submit"
                >
                    <Translation id="TR_SELL_SHOW_OFFERS" />
                </StyledButton>
            </StyledRight>
        </FooterWrapper>
    );
};

export default Footer;
