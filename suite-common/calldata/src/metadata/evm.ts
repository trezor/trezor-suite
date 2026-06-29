import { decodeFunctionResult, encodeFunctionData } from 'viem';

import { EVM_ABI } from '../constants/evm';

export const encodeTokenUriCall = (tokenId: bigint): `0x${string}` =>
    encodeFunctionData({
        abi: EVM_ABI.erc721.tokenURI,
        functionName: 'tokenURI',
        args: [tokenId],
    });

export const encodeErc1155UriCall = (id: bigint): `0x${string}` =>
    encodeFunctionData({
        abi: EVM_ABI.erc1155.uri,
        functionName: 'uri',
        args: [id],
    });

export const decodeUriResult = (data: `0x${string}`): string =>
    decodeFunctionResult({
        abi: EVM_ABI.erc721.tokenURI,
        functionName: 'tokenURI',
        data,
    }) as string;
