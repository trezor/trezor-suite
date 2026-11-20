import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TextProps } from '@suite-native/atoms';
import { TokenName } from '@suite-native/tokens';

import { NativeTokenName } from './NativeTokenName';

type AssetNameProps = Omit<TextProps, 'children'> & {
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
};

/** The name of a native token or a token; an unrecognized token's name has its URLs masked. */
export const AssetName = ({ networkSymbol, contractAddress, ...textProps }: AssetNameProps) =>
    contractAddress ? (
        <TokenName {...textProps} networkSymbol={networkSymbol} contractAddress={contractAddress} />
    ) : (
        <NativeTokenName {...textProps} networkSymbol={networkSymbol} />
    );
