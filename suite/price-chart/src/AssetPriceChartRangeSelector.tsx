import { useSelector } from 'react-redux';

import { selectAssetPriceChartRange, setAssetPriceChartRange } from '@suite/flags';
import { assetPriceChartRangeOptions } from '@suite-common/price-chart';
import { SelectBar } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

const options = assetPriceChartRangeOptions.map(({ label, range }) => ({ label, value: range }));

export const AssetPriceChartRangeSelector = () => {
    const { dispatch } = useServices(injectDispatch);
    const range = useSelector(selectAssetPriceChartRange);

    return (
        <SelectBar
            size="small"
            options={options}
            selectedOption={range}
            onChange={pickedRange => dispatch(setAssetPriceChartRange(pickedRange))}
            data-testid="@price-chart/range"
        />
    );
};
