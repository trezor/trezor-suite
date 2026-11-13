import type { CardanoProtocolParameters } from '@trezor/blockchain-link-types';
import type { types } from '@trezor/network-cardano/types';
import { typedObjectKeys } from '@trezor/utils';

type ProtocolParams = types.ProtocolParams;

let lastReportedEpoch: number | undefined;

const getDrift = (protocolParams: ProtocolParams, defaults: ProtocolParams) =>
    Object.fromEntries(
        typedObjectKeys(defaults)
            .filter(key => protocolParams[key] !== defaults[key])
            .map(key => [key, { live: protocolParams[key], default: defaults[key] }]),
    );

/**
 * Resolves the protocol parameters used to compose a Cardano transaction: the live values passed
 * by the caller completed by the compiled-in defaults, or the defaults alone.
 */
export const getCardanoProtocolParams = (
    protocolParameters: CardanoProtocolParameters | undefined,
    defaults: ProtocolParams,
): ProtocolParams => {
    if (!protocolParameters) return defaults;

    const { epoch, ...live } = protocolParameters;
    // Blockfrost reports these as null for pre-Babbage eras.
    const protocolParams: ProtocolParams = {
        ...live,
        coinsPerUtxoByte: live.coinsPerUtxoByte ?? defaults.coinsPerUtxoByte,
        maxValueSize: live.maxValueSize ?? defaults.maxValueSize,
    };

    // The parameters can change only at an epoch boundary, so a drift is reported once per epoch.
    if (epoch !== lastReportedEpoch) {
        lastReportedEpoch = epoch;
        const drift = getDrift(protocolParams, defaults);
        if (Object.keys(drift).length > 0) {
            // Protocol parameters are public chain data, so logging them leaks nothing about the
            // account. The compiled-in defaults should be updated once this appears.
            console.warn(
                'Cardano protocol parameters differ from the compiled-in defaults:',
                drift,
            );
        }
    }

    return protocolParams;
};
