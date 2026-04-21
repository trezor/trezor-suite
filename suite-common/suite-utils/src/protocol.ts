import { NETWORK_TO_PROTOCOLS, type Protocol } from '@suite-common/suite-constants';
import { type NetworkSymbol, isNetworkSymbol } from '@suite-common/wallet-config';

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
 * Parsed information from an ERC-681 ERC-20 token transfer URI.
 * @see https://eips.ethereum.org/EIPS/eip-681
 */
export type Erc681TransferInfo = {
    contractAddress: string; // The ERC-20 token contract address
    recipientAddress: string; // The transfer recipient address
    tokenAmount?: string; // Raw uint256 amount in the token's smallest unit (optional)
    chainId?: number; // Optional EIP-155 chain ID from the @chainId suffix
};

const EVM_ADDRESS_REGEXP = /^0x[0-9a-fA-F]{40}$/;

/**
 * Parses an ERC-681 ERC-20 token transfer URI.
 *
 * Supported formats:
 * - `ethereum:{contractAddress}/transfer?address={recipient}&uint256={amount}`
 * - `ethereum:{contractAddress}/transfer?address={recipient}` (amount omitted)
 * - `ethereum://{contractAddress}/transfer?address={recipient}&uint256={amount}`
 *
 * @returns Parsed transfer info, or `null` if the URI is not a valid ERC-681 transfer URI.
 */
export const parseErc681TransferUri = (uri: string): Erc681TransferInfo | null => {
    try {
        const url = new URL(uri);
        const { pathname, host, searchParams, username } = url;

        let contractAddress: string | null = null;
        let functionName: string | null = null;

        // Extract optional @chainId suffix (e.g. 0xContract@1 → { address: 0xContract, chainId: 1 })
        const extractChainId = (value: string): { address: string; chainId?: number } => {
            const match = value.match(/^(.*?)@(\d+)$/);
            if (match) return { address: match[1], chainId: Number(match[2]) };

            return { address: value };
        };

        let chainId: number | undefined;

        if (host) {
            // The URL API parses `ethereum://0xContract@chainId/...` as username=0xContract, host=chainId.
            // Handle both the plain `ethereum://0xContract/...` and the `@chainId` variant.
            if (username && EVM_ADDRESS_REGEXP.test(username)) {
                // Format: ethereum://0xContract@chainId/transfer?...
                contractAddress = username;
                chainId = /^\d+$/.test(host) ? Number(host) : undefined;
                functionName = pathname.replace(/^\//, '').replace(/\/$/, '');
            } else {
                const extracted = extractChainId(host);
                if (EVM_ADDRESS_REGEXP.test(extracted.address)) {
                    // Format: ethereum://0xContract/transfer?...
                    contractAddress = extracted.address;
                    chainId = extracted.chainId;
                    functionName = pathname.replace(/^\//, '').replace(/\/$/, '');
                }
            }
        } else if (pathname) {
            // Format: ethereum:0xContract@chainId/transfer?...
            const cleanPath = pathname.replace(/^\/+/, '');
            const slashIndex = cleanPath.indexOf('/');
            if (slashIndex !== -1) {
                const extracted = extractChainId(cleanPath.substring(0, slashIndex));
                if (EVM_ADDRESS_REGEXP.test(extracted.address)) {
                    contractAddress = extracted.address;
                    chainId = extracted.chainId;
                    functionName = cleanPath.substring(slashIndex + 1).replace(/\/$/, '');
                }
            }
        }

        if (!contractAddress || functionName !== 'transfer') return null;

        const recipientAddress = searchParams.get('address');
        const rawTokenAmount = searchParams.get('uint256');

        if (!recipientAddress || !EVM_ADDRESS_REGEXP.test(recipientAddress)) {
            return null;
        }

        // Validate that tokenAmount is a valid non-negative integer when present
        if (rawTokenAmount !== null && !/^\d+$/.test(rawTokenAmount)) return null;

        const tokenAmount = rawTokenAmount ?? undefined;

        return { contractAddress, recipientAddress, tokenAmount, chainId };
    } catch {
        return null;
    }
};
