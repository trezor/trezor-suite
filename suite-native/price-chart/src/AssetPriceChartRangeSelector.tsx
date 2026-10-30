import { useAtom } from 'jotai';

import { assetPriceChartRangeOptions } from '@suite-common/price-chart';
import { Box, SegmentedControl } from '@suite-native/atoms';

import { assetPriceChartRangeAtom } from './assetPriceChartRangeAtom';

const segmentedControlOptions = assetPriceChartRangeOptions.map(({ label, range }) => ({
    label,
    value: range,
}));

export const AssetPriceChartRangeSelector = () => {
    const [range, setRange] = useAtom(assetPriceChartRangeAtom);

    return (
        <Box paddingHorizontal="sp20">
            <SegmentedControl
                options={segmentedControlOptions}
                selectedValue={range}
                onValueChange={setRange}
                isCompact
            />
        </Box>
    );
};
