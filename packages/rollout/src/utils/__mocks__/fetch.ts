import fetch from 'cross-fetch';
import releases1 from '../../__tests__/mocks/releases1';
import releases2 from '../../__tests__/mocks/releases2';

export const fetchReleasesList = jest.fn().mockImplementation(url => {
    if (url.includes('test-2')) {
        return Promise.resolve(releases2);
    }
    return Promise.resolve(releases1);
});

export const fetchFirmware = jest.fn().mockImplementation(() => {
    return Promise.resolve(new ArrayBuffer(512));
});
