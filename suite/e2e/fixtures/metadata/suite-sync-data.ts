import { accountDescriptor, ownerSecret, walletDescriptor } from './default-metadata-ids';

export const walletSeed = {
    id: 'ya1CCDTCVPyRa6egTac7yg',
    walletDescriptor,
    label: 'Evolu synced wallet',
};

export const accountSeed = {
    id: 'RSZ0aKqUcO_e0WoQO32x4w',
    accountDescriptor,
    networkSymbol: 'btc',
    label: 'Evolu synced BTC account',
};

export const addressSeed = {
    id: 'DmBRN-GwcRyC-cuTPczSXg',
    label: 'Evolu synced BTC address',
    address: 'bc1qkkr2uvry034tsj4p52za2pg42ug4pxg5qfxyfa',
    accountDescriptor,
    networkSymbol: 'btc',
};

export const outputSeed = {
    id: 'TR7Axj6suVoVTBJO5saruA',
    accountDescriptor,
    label: 'Evolu synced output',
    networkSymbol: 'btc',
    outputIndex: '0',
    txId: 'aa545d95cf07892e1ae70b40e856b9b476f703e2e20647d0985830fd7b734393',
};

export { ownerSecret };
