import { type Protocol } from '@suite-common/suite-constants';
import { getNetworkSymbolForProtocol, parseErc681TransferUri } from '@suite-common/suite-utils';

import { parseQuery, parseUri } from './parseUri';

export type CoinProtocolInfo = {
    scheme: Protocol;
    address: string;
    amount?: number;
    token?: string; // ERC-681: token contract address
    tokenAmount?: string; // ERC-681: amount in token's smallest unit (uint256)
};

const removeLeadingTrailingSlashes = (text: string) => text.replace(/^\/{0,2}|\/$/g, '');
const AMOUNT_REGEXP = /^\d+(?:\.\d+)?$/;

const parseAmount = (amount: string | undefined): number | undefined => {
    if (!amount || !AMOUNT_REGEXP.test(amount)) {
        return undefined;
    }

    const parsedAmount = Number(amount);

    return Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : undefined;
};

export const getProtocolInfo = (
    uri: string,
): CoinProtocolInfo | null | { error: string; scheme: string } => {
    const url = parseUri(uri);

    if (url) {
        const { protocol, pathname, host, search } = url;
        const scheme = protocol.slice(0, -1) as Protocol; // slice ":" from protocol
        const params = parseQuery(search);

        if (!getNetworkSymbolForProtocol(scheme)) {
            return { error: 'Unknown protocol', scheme };
        }

        if (!pathname && !host) return null; // address may be in pathname (regular bitcoin:addr) or host (bitcoin://addr)

        // Check for ERC-681 ERC-20 token transfer format:
        // ethereum:{contractAddress}/transfer?address={recipient}&uint256={amount}
        const erc681 = parseErc681TransferUri(uri);
        if (erc681) {
            return {
                scheme: erc681.networkSymbol ?? scheme,
                address: erc681.recipientAddress,
                token: erc681.contractAddress,
                tokenAmount: erc681.tokenAmount,
            };
        }

        const amount = parseAmount(params.amount);

        const address =
            removeLeadingTrailingSlashes(pathname) || removeLeadingTrailingSlashes(host);

        return {
            scheme,
            address,
            amount,
        };
    }

    return null;
};
