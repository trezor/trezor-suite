import {
    decodeUriResult,
    encodeErc1155UriCall,
    encodeTokenUriCall,
} from '@suite-common/calldata';
import { commonQueryKeys, useQuery } from '@suite-common/react-query';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { NFT_SINGLETOKEN_STANDARDS } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import type { TokenStandard } from '@trezor/blockchain-link-types';

const IPFS_GATEWAY = 'https://cloudflare-ipfs.com/ipfs/';

// ERC1155 uri spec: replace {id} with lowercase hex token id, zero-padded to 64 chars.
const resolveUri = (uri: string, tokenId: string): string => {
    const hexId = BigInt(tokenId).toString(16).padStart(64, '0');
    const resolved = uri.replace('{id}', hexId);

    if (resolved.startsWith('ipfs://')) {
        return IPFS_GATEWAY + resolved.slice(7);
    }

    return resolved;
};

export type NftMetadata = {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{ trait_type?: string; value?: unknown }>;
};

type FetchNftMetadataParams = {
    symbol: NetworkSymbol;
    contract: string;
    tokenId: string;
    standard: TokenStandard;
};

const fetchNftMetadata = async ({
    symbol,
    contract,
    tokenId,
    standard,
}: FetchNftMetadataParams): Promise<NftMetadata> => {
    const isSingleToken = NFT_SINGLETOKEN_STANDARDS.has(standard);
    const callData = isSingleToken
        ? encodeTokenUriCall(BigInt(tokenId))
        : encodeErc1155UriCall(BigInt(tokenId));

    const rpcResponse = await TrezorConnect.blockchainEvmRpcCall({
        coin: symbol,
        from: '0x0000000000000000000000000000000000000000',
        to: contract,
        data: callData,
    });

    if (!rpcResponse.success) {
        throw new Error(`NFT URI fetch failed: ${rpcResponse.error}`);
    }

    const rawData = rpcResponse.payload.data;
    const hexData = (rawData.startsWith('0x') ? rawData : `0x${rawData}`) as `0x${string}`;
    const uri = decodeUriResult(hexData);
    const resolvedUri = resolveUri(uri, tokenId);

    if (resolvedUri.startsWith('data:application/json')) {
        const [, encoded] = resolvedUri.split(',');
        return JSON.parse(decodeURIComponent(encoded ?? '{}'));
    }

    const metadataResponse = await fetch(resolvedUri);
    if (!metadataResponse.ok) {
        throw new Error(`NFT metadata fetch failed: ${metadataResponse.status}`);
    }

    return metadataResponse.json() as Promise<NftMetadata>;
};

type UseNftMetadataParams = {
    symbol: NetworkSymbol;
    contract: string;
    tokenId: string;
    standard: TokenStandard;
};

export const useNftMetadata = ({ symbol, contract, tokenId, standard }: UseNftMetadataParams) =>
    useQuery({
        queryKey: commonQueryKeys.nftMetadata(symbol, contract, tokenId),
        queryFn: () => fetchNftMetadata({ symbol, contract, tokenId, standard }),
        enabled: !!contract && !!tokenId,
        staleTime: Infinity,
    });
