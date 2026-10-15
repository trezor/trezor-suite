import { selectRouterParams } from '@suite/router';
import { selectAssetDetailKey } from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { toTokenAddress } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';

/** The asset the route names, on the wallet on screen; undefined while either is missing. */
export const useAssetDetailKey = (): WalletAssetKey | undefined => {
    const params = useSelector(selectRouterParams);
    const symbol = params && 'symbol' in params ? params.symbol : undefined;
    const contractAddress =
        params && 'contractAddress' in params ? params.contractAddress : undefined;

    return useSelector(state =>
        symbol === undefined
            ? undefined
            : selectAssetDetailKey(
                  state,
                  symbol,
                  contractAddress === undefined ? undefined : toTokenAddress(contractAddress),
              ),
    );
};
