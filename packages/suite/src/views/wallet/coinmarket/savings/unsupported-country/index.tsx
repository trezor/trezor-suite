import * as React from 'react';
import styled from 'styled-components';
import { Controller } from 'react-hook-form';
import { useSavingsUnsupportedCountry } from '@wallet-hooks/coinmarket/savings/useSavingsUnsupportedCountry';
import { withCoinmarketSavingsLoaded } from '@wallet-components';
import regional from '@wallet-constants/coinmarket/regional';
import type { CountryOption } from '@wallet-types/coinmarketCommonTypes';
import { Button, Flag, Select, variables } from '@trezor/components';
import { getCountryLabelParts } from '@wallet-utils/coinmarket/coinmarketUtils';
import { Translation } from '@suite-components';

const Header = styled.div`
    font-size: 24px;
    line-height: 24px;
    margin-bottom: 16px;
`;

const Description = styled.div`
    font-size: 14px;
    line-height: 24px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-bottom: 32px;
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

const StyledSelect = styled(Select)`
    width: max-content;
    margin-bottom: 8px;
`;

const UnsupportedCountry = () => {
    const { supportedCountries, control, formState, handleSubmit, onSubmit } =
        useSavingsUnsupportedCountry();
    const { isDirty } = formState;
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Header>
                <Translation id="TR_SAVINGS_UNSUPPORTED_COUNTRY_HEADER" />
            </Header>
            <Description>
                <Translation id="TR_SAVINGS_UNSUPPORTED_COUNTRY_DESCRIPTION" />
            </Description>
            <Controller
                control={control}
                name="country"
                render={({ onChange, value }) => (
                    <StyledSelect
                        value={value}
                        label={<Translation id="TR_SAVINGS_UNSUPPORTED_COUNTRY_SELECT_LABEL" />}
                        options={regional.countriesOptions.filter(item =>
                            supportedCountries?.includes(item.value),
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
                        maxSearchLength={12}
                    />
                )}
            />

            <Button isDisabled={!isDirty}>
                <Translation id="TR_CONTINUE" />
            </Button>
        </form>
    );
};

export default withCoinmarketSavingsLoaded(UnsupportedCountry, {
    redirectUnauthorizedUserToLogin: false,
    title: 'TR_NAV_SAVINGS',
    checkInvityAuthenticationImmediately: false,
});
