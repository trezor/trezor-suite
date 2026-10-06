import { isSenderFrameDestroyed } from './isSenderFrameDestroyed';
import type { ElectronIpcMainInvokeEvent } from './types';

const createIpcEvent = (destroyed?: boolean): ElectronIpcMainInvokeEvent => ({
    senderFrame:
        destroyed === undefined
            ? null
            : { url: 'file:///index.html', isDestroyed: () => destroyed },
});

describe(isSenderFrameDestroyed.name, () => {
    it('returns true when senderFrame is missing', () => {
        expect(isSenderFrameDestroyed({ ipcEvent: createIpcEvent() })).toBe(true);
    });

    it('returns false when senderFrame exists and is not destroyed', () => {
        expect(isSenderFrameDestroyed({ ipcEvent: createIpcEvent(false) })).toBe(false);
    });

    it('returns true when senderFrame exists and is destroyed', () => {
        expect(isSenderFrameDestroyed({ ipcEvent: createIpcEvent(true) })).toBe(true);
    });
});
