import { NETWORK_TO_PROTOCOLS, type Protocol } from '@suite-common/suite-constants';
import {
    type NetworkSymbol,
    getNetworkByEvmChainId,
    isNetworkSymbol,
} from '@suite-common/wallet-config';

export type ProtocolToNetwork = {
    [P in Protocol]: NetworkSymbol;
};

export const getNetworkSymbolForProtocol = (protocol: Protocol): NetworkSymbol | undefined => {
    for (const symbolKey in NETWORK_TO_PROTOCOLS) {
        const symbol = symbolKey;

        if (!isNetworkSymbol(symbol)) continue;

        const protocols = NETWORK_TO_PROTOCOLS[symbol];

        if (protocols.includes(protocol)) {
            return symbol;
        }
    }

    return undefined;
};

/**
 * Parsed information from an ERC-681 URI.
 * @see https://eips.ethereum.org/EIPS/eip-681
 */
export type Erc681TransferInfo = {
    contractAddress?: string; // ERC-20 token contract address (absent for plain ETH transfers)
    recipientAddress: string; // The transfer recipient address
    tokenAmount?: string; // Raw uint256 amount in the token's smallest unit (optional)
    networkSymbol?: NetworkSymbol; // Network symbol resolved from the @chainId suffix (e.g. 8453 → 'base')
};

const EVM_ADDRESS_REGEXP = /^0x[0-9a-fA-F]{40}$/;
const DIGITS_REGEXP = /^\d+$/;
const LEADING_TRAILING_SLASH_REGEXP = /^\/|\/$/g;

// Ensures the URI uses the "ethereum://" form so the URL API treats it as
// hierarchical and splits "address@chainId" into username + host.
const ensureDoubleSlashScheme = (uri: string): string => {
    if (uri.startsWith('ethereum://')) return uri;

    return uri.replace('ethereum:', 'ethereum://');
};

/**
 * Parses an ERC-681 URI.
 *
 * Supported formats:
 * - `ethereum:[//]{address}[@{chainId}]` — plain ETH receive
 * - `ethereum:[//]{contractAddress}[@{chainId}]/transfer?address={recipient}[&uint256={amount}]` — ERC-20 transfer
 *
 * @returns Parsed info, or `null` if the URI is not a recognized ERC-681 URI.
 */
export const parseErc681TransferUri = (uri: string): Erc681TransferInfo | null => {
    let url: URL;
    try {
        url = new URL(ensureDoubleSlashScheme(uri));
    } catch {
        return null;
    }

    // After normalization, the URL API gives us:
    //   "ethereum://addr"          → username='',   host=addr
    //   "ethereum://addr@chainId"  → username=addr, host=chainId
    let address: string;
    let networkSymbol: NetworkSymbol | undefined;
    if (url.username) {
        address = url.username;

        const chainId = url.host;
        if (!DIGITS_REGEXP.test(chainId)) return null;
        networkSymbol = getNetworkByEvmChainId(Number(chainId))?.symbol;
        if (!networkSymbol) return null;
    } else {
        address = url.host;
    }

    if (!EVM_ADDRESS_REGEXP.test(address)) return null;

    const functionName = url.pathname.replace(LEADING_TRAILING_SLASH_REGEXP, '');

    // No function call — plain ETH receive. Reject if there are extraneous query
    // params (e.g. ?value=…), which signal a different URI shape we don't handle.
    if (functionName === '') {
        if (url.searchParams.size > 0) return null;

        return { recipientAddress: address, networkSymbol };
    }

    if (functionName !== 'transfer') return null;

    const recipientAddress = url.searchParams.get('address');
    const rawTokenAmount = url.searchParams.get('uint256');

    if (!recipientAddress || !EVM_ADDRESS_REGEXP.test(recipientAddress)) return null;
    if (rawTokenAmount !== null && !DIGITS_REGEXP.test(rawTokenAmount)) return null;

    return {
        contractAddress: address,
        recipientAddress,
        tokenAmount: rawTokenAmount ?? undefined,
        networkSymbol,
    };
};
