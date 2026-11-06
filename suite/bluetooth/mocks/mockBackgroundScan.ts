import { type BackgroundScan } from '../src/bluetoothBackgroundScan';

export const mockBackgroundScan = (): jest.Mocked<BackgroundScan> => ({
    start: jest.fn(),
    stop: jest.fn(),
    restartIfNeeded: jest.fn(),
});
