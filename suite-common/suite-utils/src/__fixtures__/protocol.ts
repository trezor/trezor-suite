import { type Protocol } from '@suite-common/suite-constants';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { type Erc681TransferInfo } from '../protocol';

type GetNetworkSymbolForProtocolFixture = {
    description: string;
    scheme: Protocol;
    result: NetworkSymbol | undefined;
};

export const getNetworkSymbolForProtocol: GetNetworkSymbolForProtocolFixture[] = [
    {
        description: 'should return network symbol for bitcoin protocol',
        scheme: 'bitcoin',
        result: 'btc',
    },
    {
        description: 'should return network symbol for litecoin protocol',
        scheme: 'litecoin',
        result: 'ltc',
    },
    {
        description: 'should return undefined for unknown protocol',
        scheme: 'unknown' as Protocol,
        result: undefined,
    },
];

type ParseErc681TransferUriFixture = {
    description: string;
    uri: string;
    result: Erc681TransferInfo | null;
};

export const parseErc681TransferUri: ParseErc681TransferUriFixture[] = [
    {
        description: 'should parse ERC-681 token transfer URI without double slash',
        uri: 'ethereum:0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7/transfer?address=0x8e23ee67d1332ad560396262c48ffbb01f93d052&uint256=1',
        result: {
            contractAddress: '0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7',
            recipientAddress: '0x8e23ee67d1332ad560396262c48ffbb01f93d052',
            tokenAmount: '1',
        },
    },
    {
        description: 'should parse ERC-681 token transfer URI with double slash',
        uri: 'ethereum://0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7/transfer?address=0x8e23ee67d1332ad560396262c48ffbb01f93d052&uint256=1000000',
        result: {
            contractAddress: '0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7',
            recipientAddress: '0x8e23ee67d1332ad560396262c48ffbb01f93d052',
            tokenAmount: '1000000',
        },
    },
    {
        description: 'should parse ERC-681 URI with large uint256 amount',
        uri: 'ethereum:0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7/transfer?address=0x8e23ee67d1332ad560396262c48ffbb01f93d052&uint256=1000000000000000000',
        result: {
            contractAddress: '0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7',
            recipientAddress: '0x8e23ee67d1332ad560396262c48ffbb01f93d052',
            tokenAmount: '1000000000000000000',
        },
    },
    {
        description: 'should parse ERC-681 URI with tokenAmount omitted',
        uri: 'ethereum:0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7/transfer?address=0x8e23ee67d1332ad560396262c48ffbb01f93d052',
        result: {
            contractAddress: '0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7',
            recipientAddress: '0x8e23ee67d1332ad560396262c48ffbb01f93d052',
            tokenAmount: undefined,
        },
    },
    {
        description: 'should return null for ERC-681 URI missing address parameter',
        uri: 'ethereum:0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7/transfer?uint256=1000000',
        result: null,
    },
    {
        description: 'should return null for non-transfer function',
        uri: 'ethereum:0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7/approve?address=0x8e23ee67d1332ad560396262c48ffbb01f93d052&uint256=1',
        result: null,
    },
    {
        description: 'should return null for simple ETH transfer (no function)',
        uri: 'ethereum:0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7?value=1000000000000000000',
        result: null,
    },
    {
        description: 'should return null for invalid contract address',
        uri: 'ethereum:notanaddress/transfer?address=0x8e23ee67d1332ad560396262c48ffbb01f93d052&uint256=1',
        result: null,
    },
    {
        description: 'should return null for invalid recipient address',
        uri: 'ethereum:0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7/transfer?address=notanaddress&uint256=1',
        result: null,
    },
    {
        description: 'should return null for non-integer uint256 value',
        uri: 'ethereum:0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7/transfer?address=0x8e23ee67d1332ad560396262c48ffbb01f93d052&uint256=1.5',
        result: null,
    },
    {
        description: 'should parse ERC-681 URI with @chainId suffix (no double slash)',
        uri: 'ethereum:0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7@1/transfer?address=0x8e23ee67d1332ad560396262c48ffbb01f93d052&uint256=1000000',
        result: {
            contractAddress: '0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7',
            recipientAddress: '0x8e23ee67d1332ad560396262c48ffbb01f93d052',
            tokenAmount: '1000000',
            chainId: 1,
        },
    },
    {
        description: 'should parse ERC-681 URI with @chainId suffix (double slash)',
        uri: 'ethereum://0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7@137/transfer?address=0x8e23ee67d1332ad560396262c48ffbb01f93d052&uint256=500000',
        result: {
            contractAddress: '0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7',
            recipientAddress: '0x8e23ee67d1332ad560396262c48ffbb01f93d052',
            tokenAmount: '500000',
            chainId: 137,
        },
    },
];
