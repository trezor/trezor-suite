// todo: this should be removed and protobuf types should be used instead

export const PROTOCOL_MAGICS = Object.freeze({
    mainnet: 764824073,
    testnet: 42,
});

export const NETWORK_IDS = Object.freeze({
    mainnet: 1,
    testnet: 0,
});

// constants below are deprecated
// use `CardanoAddressType`, `CardanoCertificateType` and `CardanoPoolRelayType` from protobuf instead

export const ADDRESS_TYPE = Object.freeze({
    Base: 0,
    Pointer: 4,
    Enterprise: 6,
    Byron: 8,
    Reward: 14,
});

export const CERTIFICATE_TYPE = Object.freeze({
    StakeRegistration: 0,
    StakeDeregistration: 1,
    StakeDelegation: 2,
    StakePoolRegistration: 3,
});

export const POOL_RELAY_TYPE = Object.freeze({
    SingleHostIp: 0,
    SingleHostName: 1,
    MultipleHostName: 2,
});
