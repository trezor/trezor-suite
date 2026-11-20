import { useSelector } from 'react-redux';

import { type NetworksRootState, selectNativeTokenName } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';

type NativeTokenNameProps = {
    networkSymbol: NetworkSymbol;
};

/** The name of a network's native token. */
export const NativeTokenName = ({ networkSymbol }: NativeTokenNameProps) => {
    const name = useSelector((state: NetworksRootState) =>
        selectNativeTokenName(state, networkSymbol),
    );

    return name ?? null;
};
