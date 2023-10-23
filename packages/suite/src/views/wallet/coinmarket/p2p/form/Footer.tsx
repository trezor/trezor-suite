import { Controller } from 'react-hook-form';
import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { Button, Flag, Select, variables } from '@trezor/components';
import regional from 'src/constants/wallet/coinmarket/regional';
import { CountryOption } from 'src/types/wallet/coinmarketCommonTypes';
import { useCoinmarketP2pFormContext } from 'src/hooks/wallet/useCoinmarketP2pForm';
import { FooterWrapper, Left, Right } from 'src/views/wallet/coinmarket';
import { getCountryLabelParts } from 'src/utils/wallet/coinmarket/coinmarketUtils';

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

export const Footer = () => {
    const {
        control,
        formState: { errors, isSubmitting },
        watch,
        defaultCountry,
        p2pInfo,
    } = useCoinmarketP2pFormContext();
    const countrySelect = 'countrySelect';
    const hasValues = watch('fiatInput') && !!watch('currencySelect').value;
    // used instead of formState.isValid, which is sometimes returning false even if there are no errors
    const formIsValid = Object.keys(errors).length === 0;

    return (
        <FooterWrapper>
            <Left>
                <Label>
                    <Translation id="TR_P2P_OFFERS_FOR" />
                </Label>
                <Controller
                    control={control}
                    defaultValue={defaultCountry}
                    name={countrySelect}
                    render={({ field: { onChange, value } }) => (
                        <StyledSelect
                            options={regional.countriesOptions.filter(
                                c =>
                                    c.value === regional.unknownCountry ||
                                    p2pInfo?.supportedCountries.has(c.value),
                            )}
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
                            hideTextCursor
                            onChange={(selected: any) => {
                                onChange(selected);
                            }}
                        />
                    )}
                />
            </Left>
            <StyledRight>
                <StyledButton
                    isDisabled={!(formIsValid && hasValues) || isSubmitting}
                    isLoading={isSubmitting}
                    type="submit"
                    data-test="@coinmarket/p2p/compare-button"
                >
                    <Translation id="TR_P2P_SHOW_OFFERS" />
                </StyledButton>
            </StyledRight>
        </FooterWrapper>
    );
};
