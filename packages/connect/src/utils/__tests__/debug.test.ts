import { initLog, enableLog, enableLogByPrefix, getLog } from '../debug';

describe('utils/debug', () => {
    it('max entries', () => {
        const l = initLog('test');
        const l2 = initLog('test2');
        for (let i = 0; i < 110; i++) {
            l.log('entry');
            l2.error('entry');
            l.warn('entry');
            l2.debug('entry');
        }
        expect(l.messages.length).toEqual(100);
        expect(l2.messages.length).toEqual(100);
        expect(getLog().length).toEqual(200); // combined
    });

    it('enable/disable', () => {
        const l = initLog('test', true);
        const l2 = initLog('test2');
        enableLogByPrefix('foobar', false);
        enableLogByPrefix('test2', true); // enable only one
        expect(l.enabled).toEqual(true);
        expect(l2.enabled).toEqual(true);
        enableLog(false); // disable all
        expect(l.enabled).toEqual(false);
        expect(l2.enabled).toEqual(false);
    });
});
