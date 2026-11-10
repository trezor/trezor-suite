import { getTokenDisplaySymbol, useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type TextProps } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { TokenUrlBlur } from './TokenUrlBlur';

type TokenSymbolProps = Omit<TextProps, 'children'> & {
    networkSymbol: NetworkSymbol;
    contractAddress: TokenAddress;
    isTruncated?: boolean;
};

export const TokenSymbol = ({
    networkSymbol,
    contractAddress,
    isTruncated = false,
    ...props
}: TokenSymbolProps) => {
    const { translate } = useTranslate();
    const token = useTokenMetadata(networkSymbol, contractAddress);
    const text =
        getTokenDisplaySymbol(token, { isTruncated }) ?? translate('generic.unknownToken');

    return (
        <TokenUrlBlur
            {...props}
            text={text}
            networkSymbol={networkSymbol}
            contractAddress={contractAddress}
        />
    );
};
