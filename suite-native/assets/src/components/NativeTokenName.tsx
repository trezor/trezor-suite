import { useSelector } from 'react-redux';

import { type NetworksRootState, selectNativeTokenName } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Text, type TextProps } from '@suite-native/atoms';

type NativeTokenNameProps = Omit<TextProps, 'children'> & {
    networkSymbol: NetworkSymbol;
};

/** The name of a network's native token. */
export const NativeTokenName = ({ networkSymbol, ...textProps }: NativeTokenNameProps) => {
    const name = useSelector((state: NetworksRootState) =>
        selectNativeTokenName(state, networkSymbol),
    );

    return <Text {...textProps}>{name}</Text>;
};
