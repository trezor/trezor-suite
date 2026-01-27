import { Control, Controller } from 'react-hook-form';

import { Translation } from '@suite/intl';
import {
    TRADING_FORM_COUNTRY_SELECT,
    TradingCountryOption,
    useCountryFilteredData,
} from '@suite-common/trading';
import { Flag, Row, Select } from '@trezor/components';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingTradeBuySellType } from 'src/types/trading/trading';
import {
    TradingBuySellFormProps,
    TradingFormInputDefaultProps,
} from 'src/types/trading/tradingForm';
import { getCountryLabelParts } from 'src/utils/wallet/trading/tradingUtils';

export const TradingFormInputCountry = ({ label }: TradingFormInputDefaultProps) => {
    const { control, setAmountLimits, defaultCountry } =
        useTradingFormContext<TradingTradeBuySellType>();

    const { filteredData, setFilterValue } = useCountryFilteredData();

    return (
        <Controller
            name={TRADING_FORM_COUNTRY_SELECT}
            defaultValue={defaultCountry}
            control={control as Control<TradingBuySellFormProps>}
            render={({ field: { onChange, value } }) => (
                <Select
                    value={value}
                    options={filteredData}
                    labelLeft={label && <Translation id={label} />}
                    onChange={selected => {
                        onChange(selected);
                        setAmountLimits(undefined);
                    }}
                    onInputChange={setFilterValue}
                    filterOption={() => true}
                    formatOptionLabel={(option: TradingCountryOption) => {
                        const labelParts = getCountryLabelParts(option.label);
                        if (!labelParts) return null;

                        return (
                            <Row gap={16}>
                                <Flag
                                    country={
                                        option.value === 'unknown' ||
                                        option.value === 'XX' ||
                                        option.value === 'T1'
                                            ? 'UNKNOWN'
                                            : option.value
                                    }
                                />

                                {labelParts.text}
                            </Row>
                        );
                    }}
                    data-testid="@trading/form/country-select"
                    isClearable={false}
                    minValueWidth="160px"
                    isSearchable
                    // Keep menu anchored to the top (best query matches) instead of auto-scrolling to the currently selected option
                    isScrollToSelectedEnabled={false}
                />
            )}
        />
    );
};
