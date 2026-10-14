import { type NetworkSymbol } from '@suite-common/wallet-config';

import { useFetchFeesOnce, useRefetchFees } from './useRefetchFees';

type UseFetchFeesProps = {
    networkSymbol?: NetworkSymbol;
    isRefetchDisabled?: boolean;
};

export function useFetchFees({ networkSymbol, isRefetchDisabled = false }: UseFetchFeesProps) {
    useFetchFeesOnce({ networkSymbol });
    useRefetchFees({ networkSymbol, isDisabled: isRefetchDisabled });
}
