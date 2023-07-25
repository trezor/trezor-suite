import { versionCompare } from './versionUtils';
import { PROTO } from '../constants';
import { config } from '../data/config';
import type { Features, CoinInfo, UnavailableCapabilities } from '../types';

const DEFAULT_CAPABILITIES_T1: PROTO.Capability[] = [
    'Capability_Bitcoin',
    'Capability_Bitcoin_like',
    'Capability_Crypto',
    'Capability_Ethereum',
    'Capability_NEM',
    'Capability_Stellar',
    'Capability_U2F',
];

const DEFAULT_CAPABILITIES_TT: PROTO.Capability[] = [
    'Capability_Bitcoin',
    'Capability_Bitcoin_like',
    'Capability_Binance',
    'Capability_Cardano',
    'Capability_Crypto',
    'Capability_EOS',
    'Capability_Ethereum',
    'Capability_Monero',
    'Capability_NEM',
    'Capability_Ripple',
    'Capability_Stellar',
    'Capability_Tezos',
    'Capability_U2F',
];

export const parseCapabilities = (features?: Features): PROTO.Capability[] => {
    if (!features || features.firmware_present === false) return []; // no features or no firmware - no capabilities
    // fallback for older firmware that does not report capabilities
    if (!features.capabilities || !features.capabilities.length) {
        return features.major_version === 1 ? DEFAULT_CAPABILITIES_T1 : DEFAULT_CAPABILITIES_TT;
    }
    return features.capabilities;
};

// TODO: support type
export const getUnavailableCapabilities = (features: Features, coins: CoinInfo[]) => {
    const { capabilities } = features;
    const list: UnavailableCapabilities = {};
    if (!capabilities) return list;
    const fw = [features.major_version, features.minor_version, features.patch_version];
    const key = `trezor${features.major_version}` as 'trezor1' | 'trezor2';

    // 1. check if firmware version is supported by CoinInfo.support
    const supported = coins.filter(info => {
        if (!info.support || typeof info.support[key] !== 'string') {
            list[info.shortcut.toLowerCase()] = 'no-support';
            return false;
        }
        return true;
    });

    // 2. check if current firmware have enabled capabilities
    const unavailable = supported.filter(info => {
        if (info.type === 'bitcoin') {
            if (info.name === 'Bitcoin' || info.name === 'Testnet' || info.name === 'Regtest') {
                return !capabilities.includes('Capability_Bitcoin');
            }
            return !capabilities.includes('Capability_Bitcoin_like');
        }
        if (info.type === 'ethereum') {
            return !capabilities.includes('Capability_Ethereum');
        }
        if (info.type === 'nem') {
            return !capabilities.includes('Capability_NEM');
        }
        // misc
        if (info.shortcut === 'BNB') return !capabilities.includes('Capability_Binance');
        if (info.shortcut === 'ADA' || info.shortcut === 'tADA')
            return !capabilities.includes('Capability_Cardano');
        if (info.shortcut === 'XRP' || info.shortcut === 'tXRP')
            return !capabilities.includes('Capability_Ripple');
        return !capabilities.includes(`Capability_${info.name}` as PROTO.Capability);
    });

    // add unavailable coins to list
    unavailable.forEach(info => {
        list[info.shortcut.toLowerCase()] = 'no-capability';
    });

    // 3. check if firmware version is in range of CoinInfo.support
    supported
        .filter(info => !unavailable.includes(info))
        .forEach(info => {
            if (versionCompare(info.support[key], fw) > 0) {
                list[info.shortcut.toLowerCase()] = 'update-required';
                unavailable.push(info);
            }
        });

    // 4. check if firmware version is in range of capabilities in "config.supportedFirmware"
    config.supportedFirmware.forEach(s => {
        if (!s.capabilities) return;
        const min = s.min ? s.min[fw[0] - 1] : null;
        const max = s.max ? s.max[fw[0] - 1] : null;
        if (min && (min === '0' || versionCompare(min, fw) > 0)) {
            const value = min === '0' ? 'no-support' : 'update-required';
            s.capabilities.forEach(m => {
                list[m] = value;
            });
        }
        if (max && versionCompare(max, fw) < 0) {
            s.capabilities.forEach(m => {
                list[m] = 'trezor-connect-outdated';
            });
        }
    });
    return list;
};

/**
 * Fixes an inconsistency in representation of device feature revision attribute (git commit of specific release).
 * - T1 uses standard hexadecimal notation. (df0963ec48f01f3d07ffca556e21ff0070cab099)
 * - TT old fw <2.2.4 uses hexadecimal raw bytes notation. (6466303936336563)
 * To avoid being model specific, in case the inconsistency is fixed, it is required to reliably detect what encoding is used.
 * @param {Features} features
 * @returns revision - standard hexadecimal notation or null
 */
export const parseRevision = (features: Features) => {
    const { revision } = features;

    // if device is in bootloader mode, revision is null
    if (!revision) return null;

    // if revision contains at least one a-f character and the rest are numbers, it is already in standard hexadecimal notation
    if (/^(?=.*[a-f])([a-f0-9]*)$/gi.test(revision)) return revision;

    // otherwise it is probably in hexadecimal raw bytes representation so we encode it into standard hexadecimal notation
    const revisionUtf8 = Buffer.from(revision, 'hex').toString('utf-8');
    /**
     * We have to make sure, that revision was not in standard hexadecimal notation before encoding,
     * that means it consisted only from decimal numbers (chance close to zero).
     * So, if it contains characters different from a-f and numbers, it was in hexadecimal notation before encoding.
     */
    return /^([a-f0-9])*$/gi.test(revisionUtf8) ? revisionUtf8 : revision;
};

export const ensureInternalModelFeature = (model: Features['model']) => {
    switch (model.toUpperCase()) {
        case '1':
            return 'T1B1';
        case 'T':
            return 'T2T1';
        default:
            return '';
    }
};
