// original file https://github.com/trezor/connect/blob/develop/src/js/device/DeviceCommands.js

import { MessagesSchema as Messages } from '@trezor/protobuf';

import { ERRORS, PROTO } from '../constants';
import { getBech32Network, getSegwitNetwork } from '../data/coinInfo';
import type { TypedCallProvider } from '../device/DeviceCurrentSession';
import { resolveDescriptorForTaproot } from '../device/resolveDescriptorForTaproot';
import type { BitcoinNetworkInfo, CoinInfo, Network } from '../types';
import type { HDNodeResponse } from '../types/api/getPublicKey';
import * as hdnodeUtils from '../utils/hdnodeUtils';
import { getScriptType, getSerializedPath, isTaprootPath } from '../utils/pathUtils';

type TypedCall = Messages.TypedCall;

export type { TypedCall };

export type AccountDescriptor = {
    descriptor: string;
    legacyXpub?: string;
    address_n: number[];
    descriptorChecksum?: string;
};

export const DeviceCommands = (deviceTypedCall: TypedCallProvider) => {
    const typedCall = deviceTypedCall.typedCall.bind(deviceTypedCall);

    const unlockPath = (params?: Messages.UnlockPath) =>
        typedCall('UnlockPath', 'UnlockedPathRequest', params);

    const getPublicKey = async (params: Messages.GetPublicKey, unlock?: Messages.UnlockPath) => {
        if (unlock) {
            await unlockPath(unlock);
        }

        const response = await typedCall('GetPublicKey', 'PublicKey', {
            address_n: params.address_n,
            coin_name: params.coin_name || 'Bitcoin',
            script_type: params.script_type,
            show_display: params.show_display,
            ignore_xpub_magic: params.ignore_xpub_magic,
            ecdsa_curve_name: params.ecdsa_curve_name,
        });

        return response.message;
    };

    // Validation of xpub
    const getHDNode = async (
        params: Messages.GetPublicKey,
        options: {
            coinInfo: BitcoinNetworkInfo;
            validation?: boolean;
            unlockPath?: Messages.UnlockPath;
        },
    ) => {
        const path = params.address_n;
        const { coinInfo, unlockPath: unlock } = options;
        const validation = typeof options.validation === 'boolean' ? options.validation : true;

        let network: Network | null = null;

        if (!params.script_type) {
            params.script_type = getScriptType(path);
        }

        if (params.script_type === 'SPENDP2SHWITNESS') {
            network = getSegwitNetwork(coinInfo);
        } else if (params.script_type === 'SPENDWITNESS') {
            network = getBech32Network(coinInfo);
        }

        if (!network) {
            network = coinInfo.network;
        }

        if (!params.coin_name) {
            // use default name
            params.coin_name = coinInfo.name;
        }

        let publicKey: Messages.PublicKey;
        if (params.show_display || !validation) {
            publicKey = await getPublicKey(params, unlock);
        } else {
            const suffix = 0;
            const childPath = path.concat([suffix]);
            const resKey = await getPublicKey(params, unlock);
            const childKey = await getPublicKey({ ...params, address_n: childPath }, unlock);
            publicKey = hdnodeUtils.xpubDerive(resKey, childKey, suffix, network, coinInfo.network);
        }

        const response: HDNodeResponse = {
            path,
            serializedPath: getSerializedPath(path),
            childNum: publicKey.node.child_num,
            xpub: publicKey.xpub,
            chainCode: publicKey.node.chain_code,
            publicKey: publicKey.node.public_key,
            fingerprint: publicKey.node.fingerprint,
            depth: publicKey.node.depth,
            descriptor: publicKey.descriptor,
        };

        if (network !== coinInfo.network) {
            response.xpubSegwit = response.xpub;
            response.xpub = hdnodeUtils.convertXpub(publicKey.xpub, network, coinInfo.network);
        }

        if (isTaprootPath(path)) {
            const { checksum, xpub: xpubSegwit } = resolveDescriptorForTaproot({
                response,
                publicKey,
            });
            response.xpubSegwit = xpubSegwit;
            response.descriptorChecksum = checksum;
        }

        return response;
    };

    const getAddress = async (
        { address_n, show_display, multisig, script_type, chunkify }: Messages.GetAddress,
        coinInfo: BitcoinNetworkInfo,
    ) => {
        if (!script_type) {
            script_type = getScriptType(address_n);
            if (script_type === 'SPENDMULTISIG' && !multisig) {
                script_type = 'SPENDADDRESS';
            }
        }
        if (multisig && multisig.pubkeys) {
            // convert xpub strings to HDNodeTypes
            multisig.pubkeys.forEach(pk => {
                if (typeof pk.node === 'string') {
                    pk.node = hdnodeUtils.xpubToHDNodeType(pk.node, coinInfo.network);
                }
            });
        }
        const response = await typedCall('GetAddress', 'Address', {
            address_n,
            coin_name: coinInfo.name,
            show_display,
            multisig,
            script_type: script_type || 'SPENDADDRESS',
            chunkify,
        });

        return response.message;
    };

    const ethereumGetAddress = async (params: Messages.EthereumGetAddress) => {
        const response = await typedCall('EthereumGetAddress', 'EthereumAddress', params);

        return response.message;
    };

    const ethereumGetPublicKey = async ({
        address_n,
        show_display,
    }: Messages.EthereumGetPublicKey) => {
        const suffix = 0;
        const childPath = address_n.concat([suffix]);
        const resKey = await typedCall('EthereumGetPublicKey', 'EthereumPublicKey', {
            address_n,
            show_display,
        });
        const childKey = await typedCall('EthereumGetPublicKey', 'EthereumPublicKey', {
            address_n: childPath,
            show_display: false,
        });

        return hdnodeUtils.xpubDerive(resKey.message, childKey.message, suffix);
    };

    const preauthorize = async (throwError: boolean) => {
        try {
            await typedCall('DoPreauthorized', 'PreauthorizedRequest', {});

            return true;
        } catch (error) {
            if (throwError) throw error;

            return false;
        }
    };

    const getAccountDescriptor = async (
        coinInfo: CoinInfo,
        address_n: number[],
        derivationType: Messages.CardanoDerivationType = PROTO.CardanoDerivationType.ICARUS_TREZOR,
    ): Promise<AccountDescriptor> => {
        if (coinInfo.type === 'bitcoin') {
            const resp = await getHDNode({ address_n }, { coinInfo, validation: false });

            return {
                descriptor: resp.xpubSegwit || resp.xpub,
                legacyXpub: resp.xpub,
                address_n,
                descriptorChecksum: resp.descriptorChecksum,
            };
        }
        if (coinInfo.type === 'ethereum') {
            const { message } = await typedCall('EthereumGetAddress', 'EthereumAddress', {
                address_n,
            });

            return {
                descriptor: message.address,
                address_n,
            };
        }
        if (coinInfo.shortcut === 'ADA' || coinInfo.shortcut === 'tADA') {
            const { message } = await typedCall('CardanoGetPublicKey', 'CardanoPublicKey', {
                address_n,
                derivation_type: derivationType,
            });

            return {
                descriptor: message.xpub,
                address_n,
            };
        }
        if (coinInfo.shortcut === 'XRP' || coinInfo.shortcut === 'tXRP') {
            const { message } = await typedCall('RippleGetAddress', 'RippleAddress', {
                address_n,
            });

            return {
                descriptor: message.address,
                address_n,
            };
        }

        if (coinInfo.shortcut === 'SOL' || coinInfo.shortcut === 'DSOL') {
            const { message } = await typedCall('SolanaGetAddress', 'SolanaAddress', {
                address_n,
            });

            return {
                descriptor: message.address,
                address_n,
            };
        }

        if (coinInfo.shortcut === 'XLM' || coinInfo.shortcut === 'tXLM') {
            const { message } = await typedCall('StellarGetAddress', 'StellarAddress', {
                address_n,
            });

            return {
                descriptor: message.address,
                address_n,
            };
        }

        throw ERRORS.TypedError(
            'Runtime',
            'DeviceCommands.getAccountDescriptor: unsupported coinInfo.type',
        );
    };

    return {
        unlockPath,
        getPublicKey,
        getAddress,
        ethereumGetPublicKey,
        ethereumGetAddress,
        getHDNode,
        preauthorize,
        getAccountDescriptor,
        typedCall,
    };
};
