// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EthereumSignTypedData.js

/* eslint-disable no-restricted-syntax */

import { AbstractMethod } from '../core/AbstractMethod';
import { validateParams, getFirmwareRange } from './common/paramsValidator';
import { getSlip44ByPath, validatePath } from '../utils/pathUtils';
import { getEthereumNetwork } from '../data/coinInfo';
import { getNetworkLabel } from '../utils/ethereumUtils';
import { PROTO, ERRORS } from '../constants';
import type {
    EthereumSignTypedDataTypes,
    EthereumSignTypedData as EthereumSignTypedDataParams,
    EthereumSignTypedHash as EthereumSignTypedHashParams,
} from '../types/api/ethereum';
import { getFieldType, parseArrayType, encodeData } from './ethereum/ethereumSignTypedData';
import { messageToHex } from '../utils/formatUtils';
import { getEthereumDefinitions } from './ethereum/ethereumDefinitions';

type Params = (
    | Omit<EthereumSignTypedDataParams<EthereumSignTypedDataTypes>, 'path'>
    | Omit<EthereumSignTypedHashParams<EthereumSignTypedDataTypes>, 'path'>
) & {
    address_n: number[];
};
export default class EthereumSignTypedData extends AbstractMethod<'ethereumSignTypedData', Params> {
    init() {
        this.requiredPermissions = ['read', 'write'];

        const { payload } = this;

        // validate incoming parameters
        validateParams(payload, [
            { name: 'path', required: true },
            // TT
            { name: 'metamask_v4_compat', type: 'boolean', required: true },
            { name: 'data', type: 'object', required: true },
            // T1 (optional params)
            { name: 'domain_separator_hash', type: 'string' },
            { name: 'message_hash', type: 'string' },
        ]);

        const path = validatePath(payload.path, 3);
        const network = getEthereumNetwork(path);
        this.firmwareRange = getFirmwareRange(this.name, network, this.firmwareRange);

        this.info = getNetworkLabel('Sign #NETWORK typed data', network);

        this.params = {
            address_n: path,
            metamask_v4_compat: payload.metamask_v4_compat,
            data: payload.data,
        };

        if (payload.domain_separator_hash) {
            this.params = {
                ...this.params,
                // leading `0x` in hash-strings causes issues
                domain_separator_hash: messageToHex(payload.domain_separator_hash),
            };

            if (payload.message_hash) {
                this.params = {
                    ...this.params,
                    // leading `0x` in hash-strings causes issues
                    message_hash: messageToHex(payload.message_hash),
                };
            } else if (this.params.data.primaryType !== 'EIP712Domain') {
                throw ERRORS.TypedError(
                    'Method_InvalidParameter',
                    'message_hash should only be empty when data.primaryType=EIP712Domain',
                );
            }
        }

        if (this.params.data.primaryType === 'EIP712Domain') {
            // Only newer firmwares support this feature
            // Older firmwares will give wrong results / throw errors
            this.firmwareRange = getFirmwareRange(
                'eip712-domain-only',
                network,
                this.firmwareRange,
            );

            if ('message_hash' in this.params) {
                throw ERRORS.TypedError(
                    'Method_InvalidParameter',
                    'message_hash should be empty when data.primaryType=EIP712Domain',
                );
            }
        }
    }

    async run() {
        const cmd = this.device.getCommands();
        const { address_n } = this.params;

        const network = getEthereumNetwork(address_n);
        const slip44 = getSlip44ByPath(address_n);
        const definitions = await getEthereumDefinitions({
            chainId: network?.chainId,
            slip44,
        });

        if (this.device.features.model === '1') {
            validateParams(this.params, [
                { name: 'domain_separator_hash', type: 'string', required: true },
                { name: 'message_hash', type: 'string' },
            ]);

            const { domain_separator_hash, message_hash } = this.params;

            const definitionParams = {
                ...(definitions.encoded_network && {
                    encoded_network: definitions.encoded_network,
                }),
            };

            // For T1 we use EthereumSignTypedHash
            const response = await cmd.typedCall(
                'EthereumSignTypedHash',
                'EthereumTypedDataSignature',
                {
                    address_n,
                    domain_separator_hash: domain_separator_hash as string, // TODO: https://github.com/trezor/trezor-suite/issues/5297
                    message_hash,
                    ...definitionParams,
                },
            );

            const { address, signature } = response.message;
            return {
                address,
                signature: `0x${signature}`,
            };
        }

        const { data, metamask_v4_compat } = this.params;
        const { types, primaryType, domain, message } = data;

        // For TT we use EthereumSignTypedData
        let response = await cmd.typedCall(
            'EthereumSignTypedData',
            [
                'EthereumTypedDataStructRequest',
                'EthereumTypedDataValueRequest',
                'EthereumTypedDataSignature',
            ],
            {
                address_n,
                primary_type: primaryType as string,
                metamask_v4_compat,
                definitions,
            },
        );

        // sending all the type data
        while (response.type === 'EthereumTypedDataStructRequest') {
            const { name: typeDefinitionName } = response.message;
            const typeDefinition = types[typeDefinitionName];
            if (typeDefinition === undefined) {
                throw ERRORS.TypedError(
                    'Runtime',
                    `Type ${typeDefinitionName} was not defined in types object`,
                );
            }

            const dataStruckAck: PROTO.EthereumTypedDataStructAck = {
                members: typeDefinition.map(({ name, type: typeName }) => ({
                    name,
                    type: getFieldType(typeName, types),
                })),
            };
            response = await cmd.typedCall(
                'EthereumTypedDataStructAck',
                [
                    'EthereumTypedDataStructRequest',
                    'EthereumTypedDataValueRequest',
                    'EthereumTypedDataSignature',
                ],
                dataStruckAck,
            );
        }

        // sending the whole message to be signed
        while (response.type === 'EthereumTypedDataValueRequest') {
            const { member_path } = response.message;

            let memberData;
            let memberTypeName: string;

            const [rootIndex, ...nestedMemberPath] = member_path;
            switch (rootIndex) {
                case 0:
                    memberData = domain;
                    memberTypeName = 'EIP712Domain';
                    break;
                case 1:
                    memberData = message;
                    memberTypeName = primaryType as string;
                    break;
                default:
                    throw ERRORS.TypedError('Runtime', 'Root index can only be 0 or 1');
            }

            // It can be asking for a nested structure (the member path being [X, Y, Z, ...])
            for (const index of nestedMemberPath) {
                if (Array.isArray(memberData)) {
                    memberTypeName = parseArrayType(memberTypeName).entryTypeName;
                    memberData = memberData[index];
                } else if (typeof memberData === 'object' && memberData !== null) {
                    const memberTypeDefinition = types[memberTypeName][index];
                    memberTypeName = memberTypeDefinition.type;
                    memberData = memberData[memberTypeDefinition.name];
                } else {
                    // TODO: what to do when the value is missing (for example in recursive types)?
                }
            }

            let encodedData;
            // If we were asked for a list, first sending its length and we will be receiving
            // requests for individual elements later
            if (Array.isArray(memberData)) {
                // Sending the length as uint16
                encodedData = encodeData('uint16', memberData.length);
            } else {
                encodedData = encodeData(memberTypeName, memberData);
            }

            response = await cmd.typedCall(
                'EthereumTypedDataValueAck',
                ['EthereumTypedDataValueRequest', 'EthereumTypedDataSignature'],
                {
                    value: encodedData,
                },
            );
        }

        const { address, signature } = response.message;
        return {
            address,
            signature: `0x${signature}`,
        };
    }
}
