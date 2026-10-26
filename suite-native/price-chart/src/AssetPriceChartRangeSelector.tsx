import { useAtom } from 'jotai';

import { assetPriceChartRangeOptions } from '@suite-common/price-chart';
import { SegmentedControl } from '@suite-native/atoms';

import { assetPriceChartRangeAtom } from './assetPriceChartRangeAtom';

const segmentedControlOptions = assetPriceChartRangeOptions.map(({ label, range }) => ({
    label,
    value: range,
}));

export const AssetPriceChartRangeSelector = () => {
    const [range, setRange] = useAtom(assetPriceChartRangeAtom);

    return (
        <SegmentedControl
            options={segmentedControlOptions}
            selectedValue={range}
            onValueChange={setRange}
            isCompact
        />
    );
};
