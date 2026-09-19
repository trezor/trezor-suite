import { powerSaveBlocker } from 'electron';

import { Logger } from './logger';
import { PowerSaveBlocker } from './power-save-blocker';

jest.mock('electron', () => ({
    powerSaveBlocker: {
        start: jest.fn(),
        stop: jest.fn(),
        isStarted: jest.fn(),
    },
}));

describe.each([0, 1])('PowerSaveBlocker with initial ID %i', initialId => {
    const activeBlockers = new Set<number>();
    const originalLogger = global.logger;

    beforeEach(() => {
        jest.resetAllMocks();
        activeBlockers.clear();
        global.logger = new Logger('mute');
        let nextId = initialId;
        jest.mocked(powerSaveBlocker.start).mockImplementation(() => {
            const id = nextId++;
            activeBlockers.add(id);

            return id;
        });
        jest.mocked(powerSaveBlocker.stop).mockImplementation(id => activeBlockers.delete(id));
        jest.mocked(powerSaveBlocker.isStarted).mockImplementation(id => activeBlockers.has(id));
    });

    afterEach(() => {
        global.logger = originalLogger;
    });

    it('releases the blocker when stopped', () => {
        const blocker = new PowerSaveBlocker();
        blocker.startBlockingPowerSave();

        expect(activeBlockers).toEqual(new Set([initialId]));

        blocker.stopBlockingPowerSave();

        expect(activeBlockers.size).toBe(0);
    });

    it('does not leak a blocker when started twice', () => {
        const blocker = new PowerSaveBlocker();
        blocker.startBlockingPowerSave();
        blocker.startBlockingPowerSave();

        expect(activeBlockers).toEqual(new Set([initialId]));

        blocker.stopBlockingPowerSave();

        expect(activeBlockers.size).toBe(0);
    });
});
