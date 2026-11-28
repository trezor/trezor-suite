import { shareQRCodeImage } from './shareQRCodeImage.android';

const mockShareAsync = jest.fn();

jest.mock('expo-sharing', () => ({
    shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));

describe('shareQRCodeImage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockShareAsync.mockResolvedValue(undefined);
    });

    it('shares a QR code image as PNG', async () => {
        await expect(
            shareQRCodeImage({
                imageURI: 'file:///cache/trezor-receive-address-qr.png',
                title: 'Share QR code image',
            }),
        ).resolves.toBe('unknown');

        expect(mockShareAsync).toHaveBeenCalledWith('file:///cache/trezor-receive-address-qr.png', {
            dialogTitle: 'Share QR code image',
            mimeType: 'image/png',
        });
    });
});
