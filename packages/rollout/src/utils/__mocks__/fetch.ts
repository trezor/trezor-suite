import fetch from 'cross-fetch';
import releases from '../../tests/mocks/releases';

export const fetchReleasesList = jest.fn().mockImplementation(() => {
    return Promise.resolve(releases);
});

export const fetchFirmware = jest.fn().mockImplementation(() => {
    return Promise.resolve(new ArrayBuffer(512));
});
