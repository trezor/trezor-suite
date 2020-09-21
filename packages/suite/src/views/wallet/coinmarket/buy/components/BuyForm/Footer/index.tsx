import React from 'react';
import { Button, CleanSelect, colors, variables } from '@trezor/components';
import regional from '@wallet-constants/coinmarket/regional';
import { useCoinmarketBuyFormContext } from '@wallet-hooks/useCoinmarketBuyForm';
import { getCountryLabelParts } from '@wallet-utils/coinmarket/buyUtils';
import { Option } from '@wallet-types/coinmarketBuyForm';
import { Translation } from '@suite-components';
import { Controller } from 'react-hook-form';
import styled from 'styled-components';

const Footer = () => {
    const {
        control,
        formState,
        watch,
        setAmountLimits,
        defaultCountry,
    } = useCoinmarketBuyFormContext();
    const countrySelect = 'countrySelect';
    const hasValues =
        (watch('fiatInput') || watch('cryptoInput')) && !!watch('currencySelect').value;

    return (
        <Wrapper>
            <Left>
                <Label>
                    <Translation id="TR_BUY_OFFERS_FOR" />
                </Label>
                <Controller
                    control={control}
                    defaultValue={defaultCountry}
                    name={countrySelect}
                    render={({ onChange, value }) => {
                        return (
                            <CleanSelect
                                noTopLabel
                                isHovered
                                options={regional.countriesOptions}
                                isSearchable
                                value={value}
                                formatOptionLabel={(option: Option) => {
                                    const labelParts = getCountryLabelParts(option.label);
                                    if (!labelParts) return null;

                                    return (
                                        <OptionLabel>
                                            <Flag>{labelParts.flag}</Flag>
                                            <LabelText>{labelParts.text}</LabelText>
                                        </OptionLabel>
                                    );
                                }}
                                isClearable={false}
                                minWidth="160px"
                                onChange={(selected: any) => {
                                    onChange(selected);
                                    setAmountLimits(undefined);
                                }}
                            />
                        );
                    }}
                />
            </Left>
            <Right>
                <StyledButton
                    isDisabled={!(formState.isValid && hasValues) || formState.isSubmitting}
                    isLoading={formState.isSubmitting}
                    type="submit"
                >
                    <Translation id="TR_BUY_SHOW_OFFERS" />
                </StyledButton>
            </Right>
        </Wrapper>
    );
};

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    padding-top: 50px;
    border-top: 1px solid ${colors.NEUE_STROKE_GREY};

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const OptionLabel = styled.div`
    display: flex;
    align-items: center;
`;

const Flag = styled.div`
    font-size: ${variables.FONT_SIZE.H2};
    padding-right: 5px;
`;

const LabelText = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const Left = styled.div`
    display: flex;
    flex: 1;
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-end;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        justify-content: flex-start;
    }
`;

const Label = styled.div`
    display: flex;
    align-items: center;
    padding-right: 5px;
    white-space: nowrap;
    padding-top: 1px;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
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

export default Footer;
