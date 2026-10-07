// Under the device requirement every method that talks to a device must be told which device, and
// the `device` it is told must actually identify one. The public tier is unaffected: there the
// popup host selects the device, so the caller structurally cannot name it.

import { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { TrezorConnectCallableWithRequiredDevice, TrezorConnectPublicAPI } from '../../index';
import { asDeviceUniquePath } from '../device';

type PrivilegedApi = TrezorConnectCallableWithRequiredDevice;
type PublicApi = TrezorConnectPublicAPI<Record<string, any>>;

const device = { path: asDeviceUniquePath('1') };
const deviceByState = { state: { staticSessionId: 'SUITE@device-id:1' } } as const;

export const deviceIsRequiredForDeviceUsingMethods = (api: PrivilegedApi) => {
    api.getAddress({ path: 'm/44', device });
    // @ts-expect-error getAddress talks to a device, so it has to be given one
    api.getAddress({ path: 'm/44' });

    // A device is identified by its path or by its session; `instance` and `useEmptyPassphrase`
    // alone identify nothing.
    api.getAddress({ path: 'm/44', device: deviceByState });
    api.getAddress({ path: 'm/44', device: { ...device, instance: 1, useEmptyPassphrase: true } });
    // @ts-expect-error an empty `device` does not identify a device
    api.getAddress({ path: 'm/44', device: {} });
    // @ts-expect-error `instance` alone does not identify a device
    api.getAddress({ path: 'm/44', device: { instance: 1 } });
    // @ts-expect-error `useEmptyPassphrase` alone does not identify a device
    api.getAddress({ path: 'm/44', device: { useEmptyPassphrase: true } });
    // @ts-expect-error a `state` without a static session id does not identify a device
    api.getAddress({ path: 'm/44', device: { state: { sessionId: 'session' } } });

    // Methods whose parameter object is declared optional still use a device.
    api.getFeatures({ device });
    api.wipeDevice({ device });
    api.backupDevice({ device });
    api.getDeviceState({ device });
    api.getNonce({ device });
    api.thpGetCredentials({ device });
    // @ts-expect-error getFeatures talks to a device
    api.getFeatures();
    // @ts-expect-error wipeDevice talks to a device
    api.wipeDevice();

    // `getSettings` is the only method that declares no parameters at all.
    api.getSettings();

    // `thpRemoveCredentials` keeps `device` optional: its absence means "host-only removal".
    api.thpRemoveCredentials({});
    api.thpRemoveCredentials({ device });
};

export const deviceStaysOptionalOnTheLoosePublicTier = (api: PublicApi) => {
    api.getAddress({ path: 'm/44' });
    api.getAddress({ bundle: [{ path: 'm/44' }] });
    api.getAddress({ path: 'm/44', device });
    api.getAddress({ path: 'm/44', device: {} });
    api.getFeatures();
    api.ethereumGetAddress({ path: 'm/44' });
    api.cardanoGetPublicKey({ path: 'm/44' });
};

// The device requirement is intersected into each overload separately. Were the overloads collapsed
// into one signature, the bundle and single forms would stop returning distinct payloads — so every
// bundle-capable method is exercised in both forms here.
export const overloadsSurviveTheDeviceRequirement = async (api: PrivilegedApi) => {
    const getAddressSingle = await api.getAddress({ path: 'm/44', device });
    if (getAddressSingle.success) getAddressSingle.payload.address.toLowerCase();
    const getAddressBundle = await api.getAddress({ bundle: [{ path: 'm/44' }], device });
    if (getAddressBundle.success)
        getAddressBundle.payload.forEach(item => item.address.toLowerCase());
    // @ts-expect-error the bundle form needs a device as well
    api.getAddress({ bundle: [{ path: 'm/44' }] });

    const getPublicKeySingle = await api.getPublicKey({ path: 'm/44', device });
    if (getPublicKeySingle.success) getPublicKeySingle.payload.publicKey.toLowerCase();
    const getPublicKeyBundle = await api.getPublicKey({ bundle: [{ path: 'm/44' }], device });
    if (getPublicKeyBundle.success)
        getPublicKeyBundle.payload.forEach(item => item.publicKey.toLowerCase());
    // @ts-expect-error the bundle form needs a device as well
    api.getPublicKey({ bundle: [{ path: 'm/44' }] });

    const getOwnershipIdSingle = await api.getOwnershipId({ path: 'm/44', device });
    if (getOwnershipIdSingle.success) getOwnershipIdSingle.payload.ownership_id.toLowerCase();
    const getOwnershipIdBundle = await api.getOwnershipId({ bundle: [{ path: 'm/44' }], device });
    if (getOwnershipIdBundle.success)
        getOwnershipIdBundle.payload.forEach(item => item.ownership_id.toLowerCase());
    // @ts-expect-error the bundle form needs a device as well
    api.getOwnershipId({ bundle: [{ path: 'm/44' }] });

    const getOwnershipProofSingle = await api.getOwnershipProof({ path: 'm/44', device });
    if (getOwnershipProofSingle.success)
        getOwnershipProofSingle.payload.ownership_proof.toLowerCase();
    const getOwnershipProofBundle = await api.getOwnershipProof({
        bundle: [{ path: 'm/44' }],
        device,
    });
    if (getOwnershipProofBundle.success)
        getOwnershipProofBundle.payload.forEach(item => item.ownership_proof.toLowerCase());
    // @ts-expect-error the bundle form needs a device as well
    api.getOwnershipProof({ bundle: [{ path: 'm/44' }] });

    const cipherKeyValueSingle = await api.cipherKeyValue({
        path: 'm/44',
        key: 'k',
        value: 'v',
        device,
    });
    if (cipherKeyValueSingle.success) cipherKeyValueSingle.payload.value.toLowerCase();
    const cipherKeyValueBundle = await api.cipherKeyValue({
        bundle: [{ path: 'm/44', key: 'k', value: 'v' }],
        device,
    });
    if (cipherKeyValueBundle.success)
        cipherKeyValueBundle.payload.forEach(item => item.value.toLowerCase());
    // @ts-expect-error the bundle form needs a device as well
    api.cipherKeyValue({ bundle: [{ path: 'm/44', key: 'k', value: 'v' }] });

    const ethereumGetAddressSingle = await api.ethereumGetAddress({ path: 'm/44', device });
    if (ethereumGetAddressSingle.success) ethereumGetAddressSingle.payload.address.toLowerCase();
    const ethereumGetAddressBundle = await api.ethereumGetAddress({
        bundle: [{ path: 'm/44' }],
        device,
    });
    if (ethereumGetAddressBundle.success)
        ethereumGetAddressBundle.payload.forEach(item => item.address.toLowerCase());
    // @ts-expect-error the bundle form needs a device as well
    api.ethereumGetAddress({ bundle: [{ path: 'm/44' }] });

    const ethereumGetPublicKeySingle = await api.ethereumGetPublicKey({ path: 'm/44', device });
    if (ethereumGetPublicKeySingle.success)
        ethereumGetPublicKeySingle.payload.publicKey.toLowerCase();
    const ethereumGetPublicKeyBundle = await api.ethereumGetPublicKey({
        bundle: [{ path: 'm/44' }],
        device,
    });
    if (ethereumGetPublicKeyBundle.success)
        ethereumGetPublicKeyBundle.payload.forEach(item => item.publicKey.toLowerCase());
    // @ts-expect-error the bundle form needs a device as well
    api.ethereumGetPublicKey({ bundle: [{ path: 'm/44' }] });

    const cardanoGetAddressSingle = await api.cardanoGetAddress({
        addressParameters: { addressType: PROTO.CardanoAddressType.BASE, path: 'm/44' },
        protocolMagic: 0,
        networkId: 0,
        device,
    });
    if (cardanoGetAddressSingle.success) cardanoGetAddressSingle.payload.address.toLowerCase();
    const cardanoGetAddressBundle = await api.cardanoGetAddress({
        bundle: [
            {
                addressParameters: { addressType: PROTO.CardanoAddressType.BASE, path: 'm/44' },
                protocolMagic: 0,
                networkId: 0,
            },
        ],
        device,
    });
    if (cardanoGetAddressBundle.success)
        cardanoGetAddressBundle.payload.forEach(item => item.address.toLowerCase());
    // @ts-expect-error the bundle form needs a device as well
    api.cardanoGetAddress({
        bundle: [
            {
                addressParameters: { addressType: PROTO.CardanoAddressType.BASE, path: 'm/44' },
                protocolMagic: 0,
                networkId: 0,
            },
        ],
    });

    const cardanoGetPublicKeySingle = await api.cardanoGetPublicKey({ path: 'm/44', device });
    if (cardanoGetPublicKeySingle.success)
        cardanoGetPublicKeySingle.payload.publicKey.toLowerCase();
    const cardanoGetPublicKeyBundle = await api.cardanoGetPublicKey({
        bundle: [{ path: 'm/44' }],
        device,
    });
    if (cardanoGetPublicKeyBundle.success)
        cardanoGetPublicKeyBundle.payload.forEach(item => item.publicKey.toLowerCase());
    // @ts-expect-error the bundle form needs a device as well
    api.cardanoGetPublicKey({ bundle: [{ path: 'm/44' }] });

    const moneroGetAddressSingle = await api.moneroGetAddress({ path: 'm/44', device });
    if (moneroGetAddressSingle.success) moneroGetAddressSingle.payload.address.toLowerCase();
    const moneroGetAddressBundle = await api.moneroGetAddress({
        bundle: [{ path: 'm/44' }],
        device,
    });
    if (moneroGetAddressBundle.success)
        moneroGetAddressBundle.payload.forEach(item => item.address.toLowerCase());
    // @ts-expect-error the bundle form needs a device as well
    api.moneroGetAddress({ bundle: [{ path: 'm/44' }] });

    const rippleGetAddressSingle = await api.rippleGetAddress({ path: 'm/44', device });
    if (rippleGetAddressSingle.success) rippleGetAddressSingle.payload.address.toLowerCase();
    const rippleGetAddressBundle = await api.rippleGetAddress({
        bundle: [{ path: 'm/44' }],
        device,
    });
    if (rippleGetAddressBundle.success)
        rippleGetAddressBundle.payload.forEach(item => item.address.toLowerCase());
    // @ts-expect-error the bundle form needs a device as well
    api.rippleGetAddress({ bundle: [{ path: 'm/44' }] });

    const solanaGetAddressSingle = await api.solanaGetAddress({ path: 'm/44', device });
    if (solanaGetAddressSingle.success) solanaGetAddressSingle.payload.address.toLowerCase();
    const solanaGetAddressBundle = await api.solanaGetAddress({
        bundle: [{ path: 'm/44' }],
        device,
    });
    if (solanaGetAddressBundle.success)
        solanaGetAddressBundle.payload.forEach(item => item.address.toLowerCase());
    // @ts-expect-error the bundle form needs a device as well
    api.solanaGetAddress({ bundle: [{ path: 'm/44' }] });

    const solanaGetPublicKeySingle = await api.solanaGetPublicKey({ path: 'm/44', device });
    if (solanaGetPublicKeySingle.success) solanaGetPublicKeySingle.payload.publicKey.toLowerCase();
    const solanaGetPublicKeyBundle = await api.solanaGetPublicKey({
        bundle: [{ path: 'm/44' }],
        device,
    });
    if (solanaGetPublicKeyBundle.success)
        solanaGetPublicKeyBundle.payload.forEach(item => item.publicKey.toLowerCase());
    // @ts-expect-error the bundle form needs a device as well
    api.solanaGetPublicKey({ bundle: [{ path: 'm/44' }] });

    const stellarGetAddressSingle = await api.stellarGetAddress({ path: 'm/44', device });
    if (stellarGetAddressSingle.success) stellarGetAddressSingle.payload.address.toLowerCase();
    const stellarGetAddressBundle = await api.stellarGetAddress({
        bundle: [{ path: 'm/44' }],
        device,
    });
    if (stellarGetAddressBundle.success)
        stellarGetAddressBundle.payload.forEach(item => item.address.toLowerCase());
    // @ts-expect-error the bundle form needs a device as well
    api.stellarGetAddress({ bundle: [{ path: 'm/44' }] });

    const tezosGetAddressSingle = await api.tezosGetAddress({ path: 'm/44', device });
    if (tezosGetAddressSingle.success) tezosGetAddressSingle.payload.address.toLowerCase();
    const tezosGetAddressBundle = await api.tezosGetAddress({ bundle: [{ path: 'm/44' }], device });
    if (tezosGetAddressBundle.success)
        tezosGetAddressBundle.payload.forEach(item => item.address.toLowerCase());
    // @ts-expect-error the bundle form needs a device as well
    api.tezosGetAddress({ bundle: [{ path: 'm/44' }] });

    const tezosGetPublicKeySingle = await api.tezosGetPublicKey({ path: 'm/44', device });
    if (tezosGetPublicKeySingle.success) tezosGetPublicKeySingle.payload.publicKey.toLowerCase();
    const tezosGetPublicKeyBundle = await api.tezosGetPublicKey({
        bundle: [{ path: 'm/44' }],
        device,
    });
    if (tezosGetPublicKeyBundle.success)
        tezosGetPublicKeyBundle.payload.forEach(item => item.publicKey.toLowerCase());
    // @ts-expect-error the bundle form needs a device as well
    api.tezosGetPublicKey({ bundle: [{ path: 'm/44' }] });

    const tronGetAddressSingle = await api.tronGetAddress({ path: 'm/44', device });
    if (tronGetAddressSingle.success) tronGetAddressSingle.payload.address.toLowerCase();
    const tronGetAddressBundle = await api.tronGetAddress({ bundle: [{ path: 'm/44' }], device });
    if (tronGetAddressBundle.success)
        tronGetAddressBundle.payload.forEach(item => item.address.toLowerCase());
    // @ts-expect-error the bundle form needs a device as well
    api.tronGetAddress({ bundle: [{ path: 'm/44' }] });
};

// `ethereumSignTypedData` and `cardanoSignTransaction` are overloaded on the *shape* of their
// parameters rather than single-vs-bundle, and the former is generic over its EIP-712 types.
export const shapeOverloadsSurviveTheDeviceRequirement = async (api: PrivilegedApi) => {
    await api.ethereumSignTypedData({
        path: 'm/44',
        metamask_v4_compat: true,
        data: {
            types: { EIP712Domain: [], Message: [{ name: 'Test Field', type: 'string' }] },
            primaryType: 'Message',
            domain: {},
            message: { 'Test Field': 'text' },
        },
        device,
    });
    await api.ethereumSignTypedData({
        path: 'm/44',
        metamask_v4_compat: true,
        data: {
            types: { EIP712Domain: [] },
            primaryType: 'EIP712Domain',
            domain: {},
            message: {},
        },
        message_hash: '0x',
        domain_separator_hash: '0x',
        device,
    });
    await api.ethereumSignTypedData({
        path: 'm/44',
        metamask_v4_compat: true,
        data: {
            types: { EIP712Domain: [] },
            // @ts-expect-error primaryType must be one of the keys in `types`
            primaryType: 'UnknownType',
            domain: {},
            message: {},
        },
        message_hash: '0x',
        domain_separator_hash: '0x',
        device,
    });
    // @ts-expect-error ethereumSignTypedData talks to a device
    api.ethereumSignTypedData({
        path: 'm/44',
        metamask_v4_compat: true,
        data: {
            types: { EIP712Domain: [] },
            primaryType: 'EIP712Domain',
            domain: {},
            message: {},
        },
    });
};
