import { useState } from 'react';

import { getAssetTableRowLimit } from '@suite-common/assets';
import { setAreHomeAssetSmallBalancesShown } from '@suite-common/wallet-core';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

type UseAssetTableFoldingParams = {
    /** Whether the table has more rows than it shows folded. */
    isFoldable: boolean;
};

/**
 * How much of an asset table is shown: folded to `ASSET_TABLE_ROW_LIMIT` rows until expanded. The
 * small-balances switch is Home's setting, on Home and on every account alike.
 */
export const useAssetTableFolding = ({ isFoldable }: UseAssetTableFoldingParams) => {
    const { dispatch } = useServices(injectDispatch);
    const [isExpanded, setIsExpanded] = useState(false);

    const changeSmallBalances = (areShown: boolean) => {
        // Turning them on while the table is folded would otherwise change nothing on screen.
        if (areShown) {
            setIsExpanded(true);
        }
        dispatch(setAreHomeAssetSmallBalancesShown(areShown));
    };

    return {
        isExpanded,
        rowLimit: getAssetTableRowLimit({ isFoldable, isExpanded }),
        toggleExpanded: () => setIsExpanded(!isExpanded),
        changeSmallBalances,
    };
};
