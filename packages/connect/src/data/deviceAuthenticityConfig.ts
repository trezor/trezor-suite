import { PROTO } from '../constants';

type CertPubKeys = {
    rootPubKeys: string[];
    caPubKeys: string[];
};

// NOTE: only T2B1 model is required in config, other models should be optional and undefined
type ModelPubKeys = Record<PROTO.DeviceModelInternal.T2B1, CertPubKeys & { debug?: CertPubKeys }> &
    Partial<Record<Exclude<PROTO.DeviceModelInternal, 'T2B1'>, undefined>>;

export interface DeviceAuthenticityConfig extends ModelPubKeys {
    version: number;
    timestamp: string;
}

export const deviceAuthenticityConfig: DeviceAuthenticityConfig = {
    version: 1,
    timestamp: '2023-09-07T14:00:00+00:00',
    T2B1: {
        rootPubKeys: [],
        caPubKeys: [],
        debug: {
            // debug keys are used **only** to validate emulator or dev. firmware
            // use `allowDebugKeys: true` parameter in `authenticateDevice` method
            rootPubKeys: [
                '047f77368dea2d4d61e989f474a56723c3212dacf8a808d8795595ef38441427c4389bc454f02089d7f08b873005e4c28d432468997871c0bf286fd3861e21e96a',
            ],
            caPubKeys: [
                '04ba6084cb9fba7c86d5d5a86108a91d55a27056da4eabbedde88a95e1cae8bce3620889167aaf7f2db166998f950984aa195e868f96e22803c3cd991be31d39e7',
            ],
        },
    },
};
