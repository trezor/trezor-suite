import { Control, Controller } from 'react-hook-form';
import { Flag, Select } from '@trezor/components';
import regional from 'src/constants/wallet/coinmarket/regional';
import { CountryOption } from 'src/types/wallet/coinmarketCommonTypes';
import { getCountryLabelParts } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import styled from 'styled-components';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { borders, spacingsPx } from '@trezor/theme';
import CoinmarketFormInputLabel from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputLabel';
import {
    CoinmarketBuySellFormProps,
    CoinmarketFormInputDefaultProps,
} from 'src/types/coinmarket/coinmarketForm';
import { CoinmarketFormOption, CoinmarketFormOptionLabel } from 'src/views/wallet/coinmarket';
import { FORM_COUNTRY_SELECT } from 'src/constants/wallet/coinmarket/form';
import { CoinmarketTradeBuySellType } from 'src/types/coinmarket/coinmarket';

const FlagContainer = styled.div`
    position: relative;
    width: 20px;
    height: 20px;
    border-radius: ${borders.radii.full};
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

const CoinmarketFormInputCountry = ({ label }: CoinmarketFormInputDefaultProps) => {
    const { control, setAmountLimits, defaultCountry } =
        useCoinmarketFormContext<CoinmarketTradeBuySellType>();

    return (
        <>
            <CoinmarketFormInputLabel label={label} />
            <Controller
                name={FORM_COUNTRY_SELECT}
                defaultValue={defaultCountry}
                control={control as Control<CoinmarketBuySellFormProps>}
                render={({ field: { onChange, value } }) => (
                    <Select
                        value={value}
                        options={regional.countriesOptions}
                        onChange={selected => {
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
        </>
    );
};

export default CoinmarketFormInputCountry;
