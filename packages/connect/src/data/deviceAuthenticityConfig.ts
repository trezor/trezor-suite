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
        rootPubKeys: [
            '04ca97480ac0d7b1e6efafe518cd433cec2bf8ab9822d76eafd34363b55d63e60380bff20acc75cde03cffcb50ab6f8ce70c878e37ebc58ff7cca0a83b16b15fa5',
        ],
        caPubKeys: [
            '04b12efa295ad825a534b7c0bf276e93ad116434426763fa87bfa8a2f12e726906dcf566813f62eba8f8795f94dba0391c53682809cbbd7e4ba01d960b4f1c68f1',
        ],
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
