import { Platform } from 'react-native';

import { Directory } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { type AllLabelsForAccount } from '@suite-common/suite-sync';

import { exportBip329 } from './exportBip329';

const mockDirectoryWrite = jest.fn();
const mockCreateFile = jest.fn(() => ({ write: mockDirectoryWrite }));

jest.mock('expo-file-system', () => ({
    File: jest.fn().mockImplementation(() => ({
        exists: false,
        create: jest.fn(),
        write: jest.fn(),
        delete: jest.fn(),
        uri: 'file:///cache/account_labels.jsonl',
    })),
    Paths: { cache: 'file:///cache' },
    Directory: {
        pickDirectoryAsync: jest.fn(),
    },
}));

jest.mock('expo-sharing', () => ({
    shareAsync: jest.fn(),
}));

const mockPickDirectoryAsync = jest.mocked(Directory.pickDirectoryAsync);
const mockShareAsync = jest.mocked(Sharing.shareAsync);

const originalPlatformOS = Platform.OS;
const setPlatformOS = (os: typeof Platform.OS) => {
    Platform.OS = os;
};

const LABELS: AllLabelsForAccount = { accountLabel: null, addressLabels: [], outputLabels: [] };

describe('exportBip329', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        setPlatformOS(originalPlatformOS);
    });

    describe('on android', () => {
        beforeEach(() => {
            setPlatformOS('android');
        });

        it('writes the file into the picked directory and returns success', async () => {
            mockPickDirectoryAsync.mockResolvedValue({ createFile: mockCreateFile } as never);

            const result = await exportBip329(null, LABELS);

            expect(result).toEqual({ success: true });
            expect(mockCreateFile).toHaveBeenCalledTimes(1);
            expect(mockDirectoryWrite).toHaveBeenCalledTimes(1);
        });

        it('returns the cancelled reason when the user dismisses the directory picker', async () => {
            mockPickDirectoryAsync.mockRejectedValue(
                Object.assign(new Error('The file picker was cancelled by the user'), {
                    code: 'ERR_PICKER_CANCELLED',
                }),
            );

            const result = await exportBip329(null, LABELS);

            expect(result).toEqual({ success: false, reason: 'cancelled' });
        });

        it('returns the exportFailed reason for any other picker error', async () => {
            mockPickDirectoryAsync.mockRejectedValue(new Error('boom'));

            const result = await exportBip329(null, LABELS);

            expect(result).toEqual({ success: false, reason: 'exportFailed' });
        });
    });

    describe('on ios', () => {
        beforeEach(() => {
            setPlatformOS('ios');
        });

        it('shares the cached file and returns success', async () => {
            mockShareAsync.mockResolvedValue(undefined);

            const result = await exportBip329(null, LABELS);

            expect(result).toEqual({ success: true });
            expect(mockShareAsync).toHaveBeenCalledWith(
                'file:///cache/account_labels.jsonl',
                expect.objectContaining({ UTI: 'public.jsonl' }),
            );
        });
    });

    describe('on an unsupported platform', () => {
        beforeEach(() => {
            setPlatformOS('web');
        });

        it('returns the fileSavingNotSupported reason', async () => {
            const result = await exportBip329(null, LABELS);

            expect(result).toEqual({ success: false, reason: 'fileSavingNotSupported' });
        });
    });
});
