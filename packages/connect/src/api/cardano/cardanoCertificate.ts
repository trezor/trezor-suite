// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/cardanoCertificate.js

import { validatePath } from '../../utils/pathUtils';
import { PROTO, ERRORS } from '../../constants';
import {
    CardanoCertificate,
    CardanoPoolParameters,
    CardanoPoolOwner,
    CardanoPoolRelay,
} from '../../types/api/cardano';
import { Assert } from '@trezor/schema-utils';

const ipv4AddressToHex = (ipv4Address: string) =>
    Buffer.from(ipv4Address.split('.').map(ipPart => parseInt(ipPart, 10))).toString('hex');

const ipv6AddressToHex = (ipv6Address: string) => ipv6Address.split(':').join('');

const validatePoolRelay = (relay: CardanoPoolRelay) => {
    Assert(CardanoPoolRelay, relay);

    if (relay.type === PROTO.CardanoPoolRelayType.SINGLE_HOST_IP) {
        if (!relay.ipv4Address && !relay.ipv6Address) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'Either ipv4Address or ipv6Address must be supplied',
            );
        }
    } else if (relay.type === PROTO.CardanoPoolRelayType.SINGLE_HOST_NAME) {
        if (!relay.hostName) {
            throw ERRORS.TypedError('Method_InvalidParameter', 'hostName must be supplied');
        }
        if (!relay.port) {
            throw ERRORS.TypedError('Method_InvalidParameter', 'port must be supplied');
        }
    } else if (relay.type === PROTO.CardanoPoolRelayType.MULTIPLE_HOST_NAME) {
        if (!relay.hostName) {
            throw ERRORS.TypedError('Method_InvalidParameter', 'hostName must be supplied');
        }
    }
};

const validatePoolOwners = (owners: CardanoPoolOwner[]) => {
    owners.forEach(owner => {
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
    Assert(CardanoPoolParameters, poolParameters);
    validatePoolOwners(poolParameters.owners);
    poolParameters.relays.forEach(validatePoolRelay);
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
    Assert(CardanoCertificate, certificate);

    if (certificate.type === PROTO.CardanoCertificateType.STAKE_DELEGATION) {
        if (!certificate.pool) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'pool must be supplied for STAKE_DELEGATION',
            );
        }
    }

    if (certificate.type === PROTO.CardanoCertificateType.STAKE_POOL_REGISTRATION) {
        if (!certificate.poolParameters) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'poolParameters must be supplied for STAKE_POOL_REGISTRATION',
            );
        }
    }

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
