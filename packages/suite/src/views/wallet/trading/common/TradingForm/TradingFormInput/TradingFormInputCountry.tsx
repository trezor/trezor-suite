import { Control, Controller } from 'react-hook-form';

import { Flag, Select, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { regional } from '@suite-common/invity';

import { CountryOption } from 'src/types/wallet/tradingCommonTypes';
import { getCountryLabelParts } from 'src/utils/wallet/trading/tradingUtils';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    TradingBuySellFormProps,
    TradingFormInputDefaultProps,
} from 'src/types/trading/tradingForm';
import { FORM_COUNTRY_SELECT } from 'src/constants/wallet/trading/form';
import { TradingTradeBuySellType } from 'src/types/trading/trading';
import { Translation } from 'src/components/suite';

export const TradingFormInputCountry = ({ label }: TradingFormInputDefaultProps) => {
    const { control, setAmountLimits, defaultCountry } =
        useTradingFormContext<TradingTradeBuySellType>();

    return (
        <Controller
            name={FORM_COUNTRY_SELECT}
            defaultValue={defaultCountry}
            control={control as Control<TradingBuySellFormProps>}
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
                    data-testid="@trading/form/country-select"
                    isClearable={false}
                    minValueWidth="160px"
                    isSearchable
                />
            )}
        />
    );
};
