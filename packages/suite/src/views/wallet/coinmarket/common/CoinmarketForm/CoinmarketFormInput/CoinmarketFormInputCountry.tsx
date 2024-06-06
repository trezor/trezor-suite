import { Controller } from 'react-hook-form';
import {
    CoinmarketFormInput,
    CoinmarketFormInputLabel,
    CoinmarketFormOption,
    CoinmarketFormOptionLabel,
} from '../../..';
import { Flag, Select } from '@trezor/components';
import { useCoinmarketBuyFormContext } from 'src/hooks/wallet/useCoinmarketBuyForm';
import regional from 'src/constants/wallet/coinmarket/regional';
import { CountryOption } from 'src/types/wallet/coinmarketCommonTypes';
import { getCountryLabelParts } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import styled from 'styled-components';

const FlagContainer = styled.div`
    position: relative;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    overflow: hidden;
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
    const { control, setAmountLimits, defaultCountry } = useCoinmarketBuyFormContext();
    const countrySelect = 'countrySelect';

    return (
        <CoinmarketFormInput>
            <CoinmarketFormInputLabel>Country of residence</CoinmarketFormInputLabel>
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
