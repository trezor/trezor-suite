import { useSelector } from 'react-redux';

import { selectAssetPriceChartRange, setAssetPriceChartRange } from '@suite/flags';
import { assetPriceChartRangeOptions } from '@suite-common/price-chart';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { SelectBar } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useAssetPriceChartState } from './useAssetPriceChartState';

const options = assetPriceChartRangeOptions.map(({ label, range }) => ({ label, value: range }));

type AssetPriceChartRangeSelectorProps = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const AssetPriceChartRangeSelector = ({
    networkSymbol,
    tokenContract,
}: AssetPriceChartRangeSelectorProps) => {
    const { dispatch } = useServices(injectDispatch);
    const range = useSelector(selectAssetPriceChartRange);
    const { isUnavailable } = useAssetPriceChartState({ networkSymbol, tokenContract });

    if (isUnavailable) {
        return null;
    }

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
