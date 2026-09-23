import { LogsManager } from './logsManager';

describe('utils/debug', () => {
    it('max entries', () => {
        const logsManager = new LogsManager({});

        const l = logsManager.initLog('test');
        const l2 = logsManager.initLog('test2');
        for (let i = 0; i < 110; i++) {
            l.log('entry');
            l2.error('entry');
            l.warn('entry');
            l2.debug('entry');
        }
        expect(l.messages.length).toEqual(100);
        expect(l2.messages.length).toEqual(100);
        expect(logsManager.getLog().length).toEqual(200); // combined
    });

    it('getLog since', () => {
        const logsManager = new LogsManager({});

        const l = logsManager.initLog('test');
        const l2 = logsManager.initLog('test2');
        l.addMessage({ level: 'log', prefix: 'test', timestamp: 100 }, 'old');
        l2.addMessage({ level: 'log', prefix: 'test2', timestamp: 200 }, 'boundary');
        l.addMessage({ level: 'log', prefix: 'test', timestamp: 300 }, 'new');

        expect(logsManager.getLog({ since: 200 }).map(m => m.message[0])).toEqual([
            'boundary',
            'new',
        ]);
        expect(l.getLog({ since: 200 }).map(m => m.message[0])).toEqual(['new']);
        expect(l.getLog()).toBe(l.messages); // no filter keeps the live array for existing callers
        expect(logsManager.getLog().length).toEqual(3);
    });

    it('enable/disable', () => {
        const logsManager = new LogsManager({});

        const l = logsManager.initLog('test', true);
        const l2 = logsManager.initLog('test2');
        logsManager.enableLogByPrefix('foobar', false);
        logsManager.enableLogByPrefix('test2', true); // enable only one
        expect(l.enabled).toEqual(true);
        expect(l2.enabled).toEqual(true);
        logsManager.enableLog(false); // disable all
        expect(l.enabled).toEqual(false);
        expect(l2.enabled).toEqual(false);
    });
});
