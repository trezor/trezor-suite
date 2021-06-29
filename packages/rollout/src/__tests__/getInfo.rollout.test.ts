/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable camelcase */
import { getInfo } from '../index';

const { getReleasesT2, getDeviceFeatures } = global.JestMocks;

const fixtures = [
    {
        desc: 'bootloader mode - safe - rollout not specified',
        features: getDeviceFeatures({
            bootloader_mode: true,
            firmware_present: true,
            major_version: 2,
            minor_version: 0,
            patch_version: 0,
            fw_major: 2,
            fw_minor: 0,
            fw_patch: 0,
        }),
        releases: getReleasesT2([
            {
                version: [2, 1, 0],
            },
            {
                version: [2, 0, 0],
            },
        ]),
        score: undefined,
        result: {
            release: {
                version: [2, 1, 0],
            },
        },
    },
    {
        desc: 'bootloader mode - safe - not in probability',
        features: getDeviceFeatures({
            bootloader_mode: true,
            firmware_present: true,
            major_version: 2,
            minor_version: 0,
            patch_version: 0,
            fw_major: 2,
            fw_minor: 0,
            fw_patch: 0,
        }),
        releases: getReleasesT2([
            {
                version: [2, 1, 0],
                rollout: 0.2,
            },
            {
                version: [2, 0, 0],
            },
        ]),
        score: 0.5,
        result: {
            release: {
                version: [2, 0, 0],
            },
            isLatest: true,
        },
    },
    {
        desc: 'bootloader mode - safe - within probability',
        features: getDeviceFeatures({
            bootloader_mode: true,
            firmware_present: true,
            major_version: 2,
            minor_version: 0,
            patch_version: 0,
            fw_major: 2,
            fw_minor: 0,
            fw_patch: 0,
        }),
        releases: getReleasesT2([
            {
                version: [2, 1, 0],
                rollout: 0.2,
            },
            {
                version: [2, 0, 0],
            },
        ]),
        score: 0.1,
        result: {
            release: { version: [2, 1, 0] },
        },
    },
    {
        desc: 'normal mode - safe - score not specified, skip rollout',
        features: getDeviceFeatures({
            bootloader_mode: null,
            firmware_present: null,
            major_version: 2,
            minor_version: 0,
            patch_version: 0,
            fw_major: 2,
            fw_minor: 0,
            fw_patch: 0,
        }),
        releases: getReleasesT2([
            {
                version: [2, 1, 0],
                rollout: 0.2,
            },
            {
                version: [2, 0, 0],
            },
        ]),
        score: undefined,
        result: {
            release: { version: [2, 1, 0] },
        },
    },
    {
        desc: 'normal mode - safe - not in probability',
        features: getDeviceFeatures({
            bootloader_mode: null,
            firmware_present: null,
            major_version: 2,
            minor_version: 0,
            patch_version: 0,
            fw_major: null,
            fw_minor: null,
            fw_patch: null,
        }),
        releases: getReleasesT2([
            {
                version: [2, 1, 0],
                rollout: 0.2,
            },
            {
                version: [2, 0, 0],
            },
        ]),
        score: 0.5,
        result: { release: { version: [2, 0, 0] } },
    },
    {
        desc: 'normal mode - safe - within probability',
        features: getDeviceFeatures({
            bootloader_mode: null,
            firmware_present: null,
            major_version: 2,
            minor_version: 0,
            patch_version: 0,
            fw_major: null,
            fw_minor: null,
            fw_patch: null,
        }),
        releases: getReleasesT2([
            {
                version: [2, 1, 0],
                rollout: 0.2,
            },
            {
                version: [2, 0, 0],
            },
        ]),
        score: 0.1,
        result: {
            release: { version: [2, 1, 0] },
        },
    },
];

jest.mock('../utils/score', () => {
    let score: number | undefined = 0.5;

    return {
        __esModule: true, // this property makes it work
        getScore: () => score,
        _setScore: (newScore: number | undefined) => {
            score = newScore;
        },
    };
});

describe('getInfo test rollout', () => {
    fixtures.forEach(f => {
        it(f.desc, () => {
            require('../utils/score')._setScore(f.score);
            const result = getInfo({ features: f.features, releases: f.releases });
            expect(result).toMatchObject(f.result);
        });
    });
});
