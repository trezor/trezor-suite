import * as EthereumjsUtil from 'ethereumjs-util';
import BigNumber from 'bignumber.js';
import { Interface } from '@ethersproject/abi';
import { getNetwork } from './accountUtils';

export const decimalToHex = (dec: number): string => new BigNumber(dec).toString(16);

export const padLeftEven = (hex: string): string => (hex.length % 2 !== 0 ? `0${hex}` : hex);

export const sanitizeHex = ($hex: string): string => {
    const hex = $hex.toLowerCase().substring(0, 2) === '0x' ? $hex.substring(2) : $hex;
    if (hex === '') return '';
    return `0x${padLeftEven(hex)}`;
};

export const hexToDecimal = (hex: number): string => {
    const sanitized: string = sanitizeHex(hex.toString());
    return !sanitized ? 'null' : new BigNumber(sanitized).toString();
};

export const strip = (str: string): string => {
    if (str.indexOf('0x') === 0) {
        return padLeftEven(str.substring(2, str.length));
    }
    return padLeftEven(str);
};

export const validateAddress = (address: string): string | null => {
    const hasUpperCase = new RegExp('^(.*[A-Z].*)$');
    if (address.length < 1) {
        return 'Address is not set';
    }
    if (!EthereumjsUtil.isValidAddress(address)) {
        return 'Address is not valid';
    }
    if (address.match(hasUpperCase) && !EthereumjsUtil.isValidChecksumAddress(address)) {
        return 'Address is not a valid checksum';
    }
    return null;
};

export const isHex = (str: string): boolean => {
    const regExp = /^(0x|0X)?[0-9A-Fa-f]+$/g;
    return regExp.test(str);
};

export const namehash = (domain: string): string => {
    if (!domain) {
        return '0x0000000000000000000000000000000000000000000000000000000000000000';
    }
    const [label, ...remainder] = domain.split('.');
    return `0x${EthereumjsUtil.keccak256(
        namehash(remainder.join('.')) + EthereumjsUtil.keccak256(label).toString('hex'),
    ).toString('hex')}`;
};

export const resolveDomain = async (domain: string, ticker: string): Promise<string> => {
    const tokenId = namehash(domain);
    const coder = new Interface([
        {
            constant: true,
            inputs: [
                {
                    name: 'keys',
                    type: 'string[]',
                },
                {
                    name: 'tokenId',
                    type: 'uint256',
                },
            ],
            name: 'getData',
            outputs: [
                {
                    name: 'resolver',
                    type: 'address',
                },
                {
                    name: 'owner',
                    type: 'address',
                },
                {
                    name: 'values',
                    type: 'string[]',
                },
            ],
            payable: false,
            stateMutability: 'view',
            type: 'function',
        },
        {
            constant: true,
            inputs: [
                { name: 'key', type: 'string' },
                { name: 'tokenId', type: 'uint256' },
            ],
            name: 'get',
            outputs: [{ name: '', type: 'string' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
        },
    ]);
    const inputParam = coder.encodeFunctionData('getData', [
        [`crypto.${ticker.toUpperCase()}.address`],
        tokenId,
    ]);
    const params = [
        {
            data: inputParam,
            to: '0x7ea9Ee21077F84339eDa9C80048ec6db678642B1',
        },
        'latest',
    ];
    const request = {
        jsonrpc: '2.0',
        method: 'eth_call',
        params,
        id: 1,
    };
    const network = getNetwork('eth');
    if (!network || !network.web3 || !network.web3.length) {
        return '';
    }
    const socket = new WebSocket(network.web3[0]);
    socket.onopen = () => {
        socket.send(JSON.stringify(request));
    };
    return new Promise(resolve => {
        socket.onmessage = e => {
            try {
                const data = JSON.parse(e.data);
                const decoded = coder.decodeFunctionResult('getData', data.result);
                resolve(decoded[2][0]);
            } catch (e) {
                resolve('');
            }
        };
        socket.onerror = () => resolve('');
    });
};
