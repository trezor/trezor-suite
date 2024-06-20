import { Controller } from 'react-hook-form';
import {
    CoinmarketFormInput,
    CoinmarketFormInputLabel,
    CoinmarketFormOption,
    CoinmarketFormOptionLabel,
} from '../../..';
import { Flag, Select } from '@trezor/components';
import regional from 'src/constants/wallet/coinmarket/regional';
import { CountryOption } from 'src/types/wallet/coinmarketCommonTypes';
import { getCountryLabelParts } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import styled from 'styled-components';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { Translation } from 'src/components/suite';
import { spacingsPx } from '@trezor/theme';

const FlagContainer = styled.div`
    position: relative;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: ${spacingsPx.xs};
`;
const FlagWrapper = styled(Flag)`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 50% 50%;
`;

const CoinmarketFormInputCountry = () => {
    const { control, setAmountLimits, defaultCountry } =
        useCoinmarketFormContext<CoinmarketTradeBuyType>();
    const countrySelect = 'countrySelect';

    return (
        <CoinmarketFormInput>
            <CoinmarketFormInputLabel>
                <Translation id="TR_COINMARKET_COUNTRY" />
            </CoinmarketFormInputLabel>
            <Controller
                name={countrySelect}
                defaultValue={defaultCountry}
                control={control}
                render={({ field: { onChange, value } }) => (
                    <Select
                        value={value}
                        options={regional.countriesOptions}
                        onChange={(selected: any) => {
                            onChange(selected);
                            setAmountLimits(undefined);
                        }}
                        formatOptionLabel={(option: CountryOption) => {
                            const labelParts = getCountryLabelParts(option.label);
                            if (!labelParts) return null;

                            return (
                                <CoinmarketFormOption>
                                    <FlagContainer>
                                        <FlagWrapper country={option.value} />
                                    </FlagContainer>
                                    <CoinmarketFormOptionLabel>
                                        {labelParts.text}
                                    </CoinmarketFormOptionLabel>
                                </CoinmarketFormOption>
                            );
                        }}
                        data-test="@coinmarket/form/country-select"
                        isClearable={false}
                        minValueWidth="160px"
                        isSearchable
                    />
                )}
            />
        </CoinmarketFormInput>
    );
};

export default CoinmarketFormInputCountry;
