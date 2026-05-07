import { DeviceModelInternal } from '@trezor/device-utils';
import { exhaustive } from '@trezor/type-utils';

const safe3Homescreens = [
    'original_t3b1', // note - has to be first
    'blank',
    'circleweb',
    'circuit',
    'jupiter',
    'saturn',
    'starweb',
    'valentine',
];

type HomeScreensMap = Record<DeviceModelInternal, string[]>;

// original trezor images has to be first as they are send to device as '0' and the default image from fw is used
export const getHomescreens = (isBitcoinOnlyFirmware: boolean): HomeScreensMap => ({
    [DeviceModelInternal.UNKNOWN]: [
        isBitcoinOnlyFirmware ? 'orange' : 'green', // just to have something
        isBitcoinOnlyFirmware ? 'green' : 'orange',
    ],
    [DeviceModelInternal.T1B1]: [
        'original_t1b1', // note - has to be first, this is the default
        'blank',
        'circleweb',
        'circuit',
        'starweb',
        'stars',
        'bitcoin_b2',
        'bitcoin_shade',
        'bitcoin_b',
        'bitcoin_full',
        'bitcat',
        'nyancat',
        'coffee',
        'flower',
        'saturn',
        'jupiter',
        'einstein',
        'piggy',
        'honeybadger',
        'dragon',
        'narwal',
        'rabbit',
        'bunny',
        'rooster',
        'fancy',
        'genesis',
        'my_bank',
        'candle',
        'ancap',
        'anonymous',
        'mushroom',
        'invader',
        'mtgox',
        'electrum',
        'mycelium',
        'multibit',
        'reddit',
        'hacker',
        'polis',
        'carlos',
        'heart',
    ],
    [DeviceModelInternal.T2B1]: safe3Homescreens,
    [DeviceModelInternal.T3B1]: safe3Homescreens,
    [DeviceModelInternal.T2T1]: [
        'original_t2t1', // note - has to be first, this is the default
        'trezor-3d',
        'pigeon',
        'smile-1',
        'stain-1',
        'stain-2',
        'stain-3',
        'smile-2',
    ],
    [DeviceModelInternal.T3T1]: [
        isBitcoinOnlyFirmware ? 'orange' : 'green', // note - has to be first, this is the default
        'gradient',
        isBitcoinOnlyFirmware ? 'green' : 'orange',
        'solid',
        'smile-2',
    ],
    [DeviceModelInternal.T3W1]: ['original_t3w1', 'aurora', 'metallic', 'pizza-slices'],
});

type GetDefaultHomeScreenImageParms = {
    isBitcoinOnlyFirmware: boolean;
    deviceModelInternal: DeviceModelInternal;
};

export const getDefaultHomeScreenImage = ({
    deviceModelInternal,
    isBitcoinOnlyFirmware,
}: GetDefaultHomeScreenImageParms) => {
    switch (deviceModelInternal) {
        case DeviceModelInternal.T1B1:
            return 'original_t1b1';
        case DeviceModelInternal.T2T1:
            return 'original_t2t1';
        case DeviceModelInternal.T2B1:
        case DeviceModelInternal.T3B1:
            return 'original_t3b1';
        case DeviceModelInternal.T3T1:
            return isBitcoinOnlyFirmware ? 'orange' : 'green';
        case DeviceModelInternal.T3W1:
            return 'original_t3w1';
        case DeviceModelInternal.UNKNOWN:
            return isBitcoinOnlyFirmware ? 'orange' : 'green'; // just to have something
        default:
            return exhaustive(deviceModelInternal);
    }
};
