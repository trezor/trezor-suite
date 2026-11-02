import { parseDashboardParams } from './routerParams';

describe('parseDashboardParams', () => {
    it('returns the modal and the network symbol for valid params', () => {
        expect(parseDashboardParams({ modal: 'send' })?.modal).toBe('send');
        expect(parseDashboardParams({ modal: 'send' })?.networkSymbol).toBeUndefined();
        expect(parseDashboardParams({ modal: 'receive', networkSymbol: 'btc' })).toEqual({
            modal: 'receive',
            networkSymbol: 'btc',
        });
    });

    it('returns undefined for malformed params without logging', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error');

        expect(parseDashboardParams(undefined)).toBeUndefined();
        expect(parseDashboardParams(null)).toBeUndefined();
        expect(parseDashboardParams(true)).toBeUndefined();
        expect(parseDashboardParams('send')).toBeUndefined();
        expect(parseDashboardParams(['send'])).toBeUndefined();
        expect(parseDashboardParams({ networkSymbol: 'btc' })).toBeUndefined();

        expect(consoleErrorSpy).not.toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });

    it('returns undefined for invalid modal values', () => {
        expect(parseDashboardParams({ modal: 'unknown' })).toBeUndefined();
        expect(parseDashboardParams({ modal: true })).toBeUndefined();
    });
});
