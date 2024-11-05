import { Control, Controller } from 'react-hook-form';

import { Flag, Select, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import regional from 'src/constants/wallet/coinmarket/regional';
import { CountryOption } from 'src/types/wallet/coinmarketCommonTypes';
import { getCountryLabelParts } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    CoinmarketBuySellFormProps,
    CoinmarketFormInputDefaultProps,
} from 'src/types/coinmarket/coinmarketForm';
import { FORM_COUNTRY_SELECT } from 'src/constants/wallet/coinmarket/form';
import { CoinmarketTradeBuySellType } from 'src/types/coinmarket/coinmarket';
import { Translation } from 'src/components/suite';

export const CoinmarketFormInputCountry = ({ label }: CoinmarketFormInputDefaultProps) => {
    const { control, setAmountLimits, defaultCountry } =
        useCoinmarketFormContext<CoinmarketTradeBuySellType>();

    return (
        <Controller
            name={FORM_COUNTRY_SELECT}
            defaultValue={defaultCountry}
            control={control as Control<CoinmarketBuySellFormProps>}
            render={({ field: { onChange, value } }) => (
                <Select
                    value={value}
                    options={regional.countriesOptions}
                    labelLeft={label && <Translation id={label} />}
                    onChange={selected => {
                        onChange(selected);
                        setAmountLimits(undefined);
                    }}
                    formatOptionLabel={(option: CountryOption) => {
                        const labelParts = getCountryLabelParts(option.label);
                        if (!labelParts) return null;

                        return (
                            <Row gap={spacings.xs}>
                                <Flag country={option.value} />

                                {labelParts.text}
                            </Row>
                        );
                    }}
                    data-testid="@coinmarket/form/country-select"
                    isClearable={false}
                    minValueWidth="160px"
                    isSearchable
                />
            )}
        />
    );
};
