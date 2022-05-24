// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/cardanoCertificate.js

import { validateParams } from '../common/paramsValidator';
import { validatePath } from '../../utils/pathUtils';
import { PROTO, ERRORS } from '../../constants';
import type {
    CardanoCertificate,
    CardanoPoolParameters,
    CardanoPoolMargin,
    CardanoPoolOwner,
    CardanoPoolRelay,
    CardanoPoolMetadata,
} from '../../types/api/cardanoSignTransaction';

const ipv4AddressToHex = (ipv4Address: string) =>
    Buffer.from(ipv4Address.split('.').map(ipPart => parseInt(ipPart, 10))).toString('hex');

const ipv6AddressToHex = (ipv6Address: string) => ipv6Address.split(':').join('');

const validatePoolMargin = (margin: CardanoPoolMargin) => {
    validateParams(margin, [
        { name: 'numerator', type: 'string', required: true },
        { name: 'denominator', type: 'string', required: true },
    ]);
};

const validatePoolMetadata = (metadata: CardanoPoolMetadata) => {
    validateParams(metadata, [
        { name: 'url', type: 'string', required: true },
        { name: 'hash', type: 'string', required: true },
    ]);
};

const validatePoolRelay = (relay: CardanoPoolRelay) => {
    validateParams(relay, [{ name: 'type', type: 'number', required: true }]);

    if (relay.type === PROTO.CardanoPoolRelayType.SINGLE_HOST_IP) {
        const paramsToValidate: Parameters<typeof validateParams>[1] = [
            { name: 'port', type: 'number', required: true },
        ];
        if (relay.ipv4Address) {
            paramsToValidate.push({ name: 'ipv4Address', type: 'string', required: false });
        }
        if (relay.ipv6Address) {
            paramsToValidate.push({ name: 'ipv6Address', type: 'string', required: false });
        }

        validateParams(relay, paramsToValidate);

        if (!relay.ipv4Address && !relay.ipv6Address) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'Either ipv4Address or ipv6Address must be supplied',
            );
        }
    } else if (relay.type === PROTO.CardanoPoolRelayType.SINGLE_HOST_NAME) {
        validateParams(relay, [
            { name: 'hostName', type: 'string', required: true },
            { name: 'port', type: 'number', required: true },
        ]);
    } else if (relay.type === PROTO.CardanoPoolRelayType.MULTIPLE_HOST_NAME) {
        validateParams(relay, [{ name: 'hostName', type: 'string', required: true }]);
    }
};

const validatePoolOwners = (owners: CardanoPoolOwner[]) => {
    owners.forEach(owner => {
        if (owner.stakingKeyHash) {
            validateParams(owner, [
                { name: 'stakingKeyHash', type: 'string', required: !owner.stakingKeyPath },
            ]);
        }

        if (owner.stakingKeyPath) {
            validatePath(owner.stakingKeyPath, 5);
        }

        if (!owner.stakingKeyHash && !owner.stakingKeyPath) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'Either stakingKeyHash or stakingKeyPath must be supplied',
            );
        }
    });

    const ownersAsPathCount = owners.filter(owner => !!owner.stakingKeyPath).length;
    if (ownersAsPathCount !== 1) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            'Exactly one pool owner must be given as a path',
        );
    }
};

const validatePoolParameters = (poolParameters: CardanoPoolParameters) => {
    validateParams(poolParameters, [
        { name: 'poolId', type: 'string', required: true },
        { name: 'vrfKeyHash', type: 'string', required: true },
        { name: 'pledge', type: 'string', required: true },
        { name: 'cost', type: 'string', required: true },
        { name: 'margin', type: 'object', required: true },
        { name: 'rewardAccount', type: 'string', required: true },
        { name: 'owners', type: 'array', required: true },
        { name: 'relays', type: 'array', required: true, allowEmpty: true },
        { name: 'metadata', type: 'object' },
    ]);

    validatePoolMargin(poolParameters.margin);
    validatePoolOwners(poolParameters.owners);
    poolParameters.relays.forEach(validatePoolRelay);

    if (poolParameters.metadata) {
        validatePoolMetadata(poolParameters.metadata);
    }
};

export type CertificateWithPoolOwnersAndRelays = {
    certificate: PROTO.CardanoTxCertificate;
    poolOwners: PROTO.CardanoPoolOwner[];
    poolRelays: PROTO.CardanoPoolRelayParameters[];
};

export type PoolParametersWithOwnersAndRelays = {
    poolParameters?: PROTO.CardanoPoolParametersType;
    poolOwners: PROTO.CardanoPoolOwner[];
    poolRelays: PROTO.CardanoPoolRelayParameters[];
};

const transformPoolParameters = (
    poolParameters?: CardanoPoolParameters,
): PoolParametersWithOwnersAndRelays => {
    if (!poolParameters) {
        return { poolParameters: undefined, poolOwners: [], poolRelays: [] };
    }

    validatePoolParameters(poolParameters);

    return {
        poolParameters: {
            pool_id: poolParameters.poolId,
            vrf_key_hash: poolParameters.vrfKeyHash,
            pledge: poolParameters.pledge,
            cost: poolParameters.cost,
            margin_numerator: poolParameters.margin.numerator,
            margin_denominator: poolParameters.margin.denominator,
            reward_account: poolParameters.rewardAccount,
            metadata: poolParameters.metadata,
            owners_count: poolParameters.owners.length,
            relays_count: poolParameters.relays.length,
        },
        poolOwners: poolParameters.owners.map(owner => ({
            staking_key_hash: owner.stakingKeyHash,
            staking_key_path: owner.stakingKeyPath
                ? validatePath(owner.stakingKeyPath, 5)
                : undefined,
        })),
        poolRelays: poolParameters.relays.map(relay => ({
            type: relay.type,
            ipv4_address: relay.ipv4Address ? ipv4AddressToHex(relay.ipv4Address) : undefined,
            ipv6_address: relay.ipv6Address ? ipv6AddressToHex(relay.ipv6Address) : undefined,
            host_name: relay.hostName,
            port: relay.port,
        })),
    };
};

// transform incoming certificate object to protobuf messages format
export const transformCertificate = (
    certificate: CardanoCertificate,
): CertificateWithPoolOwnersAndRelays => {
    const paramsToValidate: Parameters<typeof validateParams>[1] = [
        { name: 'type', type: 'number', required: true },
    ];

    if (certificate.type !== PROTO.CardanoCertificateType.STAKE_POOL_REGISTRATION) {
        paramsToValidate.push({ name: 'scriptHash', type: 'string' });
        paramsToValidate.push({ name: 'keyHash', type: 'string' });
    }

    if (certificate.type === PROTO.CardanoCertificateType.STAKE_DELEGATION) {
        paramsToValidate.push({ name: 'pool', type: 'string', required: true });
    }

    if (certificate.type === PROTO.CardanoCertificateType.STAKE_POOL_REGISTRATION) {
        paramsToValidate.push({ name: 'poolParameters', type: 'object', required: true });
    }

    validateParams(certificate, paramsToValidate);

    const { poolParameters, poolOwners, poolRelays } = transformPoolParameters(
        certificate.poolParameters,
    );

    return {
        certificate: {
            type: certificate.type,
            path: certificate.path ? validatePath(certificate.path, 5) : undefined,
            script_hash: certificate.scriptHash,
            key_hash: certificate.keyHash,
            pool: certificate.pool,
            pool_parameters: poolParameters,
        },
        poolOwners,
        poolRelays,
    };
};
