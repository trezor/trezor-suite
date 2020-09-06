import React from 'react';
import { Button, CleanSelect, colors, variables } from '@trezor/components';
import regional from '@wallet-constants/coinmarket/regional';
import { useBuyFormContext } from '@wallet-hooks/useBuyForm';
import { Translation } from '@suite-components';
import { Controller } from 'react-hook-form';
import styled from 'styled-components';

const Footer = () => {
    const { control, formState, watch, setAmountLimits, defaultCountry } = useBuyFormContext();
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
    min-width: 200px;
    margin-left: 20px;
`;

export default Footer;
