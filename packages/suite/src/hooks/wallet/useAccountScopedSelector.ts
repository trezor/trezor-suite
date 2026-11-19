import { type HomeAssetTableState, selectAccountAssetTableState } from '@suite-common/assets';
import { type AccountKey } from '@suite-common/wallet-types';

import { useSelector } from '#src/hooks/suite/useSelector';

/** Reads the Home asset table selectors for one account, or for the wallet when no account is given. */
export const useAccountScopedSelector = <Selected>(
    accountKey: AccountKey | undefined,
    selector: (state: HomeAssetTableState) => Selected,
): Selected =>
    useSelector((state: HomeAssetTableState) =>
        selector(
            accountKey === undefined ? state : selectAccountAssetTableState(state, accountKey),
        ),
    );
