import { getTokenDisplayName, useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type TextProps } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { TokenUrlBlur } from './TokenUrlBlur';

type TokenNameProps = Omit<TextProps, 'children'> & {
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress;
};

export const TokenName = ({ networkSymbol, contractAddress, ...props }: TokenNameProps) => {
    const { translate } = useTranslate();
    const token = useTokenMetadata(networkSymbol, contractAddress);

    if (!token) return null;

    return (
        <TokenUrlBlur
            {...props}
            text={getTokenDisplayName(token) ?? translate('generic.unknownToken')}
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
        />
    );
};
