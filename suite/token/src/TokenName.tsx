import { Translation } from '@suite/intl';
import { getTokenDisplayName, useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { extractUrlsFromText } from '@trezor/utils';

import { TokenUrlBlur } from './TokenUrlBlur';

type TokenNameProps = {
    networkSymbol: NetworkSymbol;
    tokenContract: TokenAddress;
};

export const TokenName = ({ networkSymbol, tokenContract }: TokenNameProps) => {
    const token = useTokenMetadata(networkSymbol, tokenContract);

    if (!token) return null;

    const name = getTokenDisplayName(token);

    if (name === null) return <Translation id="TR_UNKNOWN_TOKEN" />;

    return <TokenUrlBlur text={name} networkSymbol={networkSymbol} tokenContract={tokenContract} />;
};

const URL_MASK = '…';

/** A token name with its URLs replaced by an ellipsis, for text that cannot be blurred. */
export const maskUrls = (text: string) => {
    const { textParts, urls } = extractUrlsFromText(text);
    const maskedParts = urls.map((_url, index) => `${textParts[index]}${URL_MASK}`);

    return [...maskedParts, textParts[urls.length] ?? ''].join('');
};
