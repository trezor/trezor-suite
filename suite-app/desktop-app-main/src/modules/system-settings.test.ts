import { app } from '../typed-electron';
import { init } from './system-settings';

const ipcHandlers: Record<string, (...args: any[]) => any> = {};

jest.mock('../ipcMain', () => ({
    ipcMain: {
        handle: (channel: string, handler: (...args: any[]) => any) => {
            ipcHandlers[channel] = handler;
        },
    },
}));

jest.mock('../typed-electron', () => ({
    app: { getLocaleCountryCode: jest.fn(), getPreferredSystemLanguages: jest.fn() },
}));

describe('system/get-locale', () => {
    beforeAll(() => {
        init({} as never);
    });

    it.each([
        ['AU', ['en-AU', 'cs-CZ'], { regionCode: 'AU', preferredLanguages: ['en-AU', 'cs-CZ'] }],
        ['', [], { regionCode: null, preferredLanguages: [] }],
    ])(
        'returns the OS region %j and preferred languages %j',
        (regionCode, preferredLanguages, expected) => {
            jest.mocked(app.getLocaleCountryCode).mockReturnValue(regionCode);
            jest.mocked(app.getPreferredSystemLanguages).mockReturnValue(preferredLanguages);

            expect(ipcHandlers['system/get-locale']?.({} as never, 'unexpected-extra-arg')).toEqual(
                expected,
            );
        },
    );
});
