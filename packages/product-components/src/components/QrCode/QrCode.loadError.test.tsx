import { act, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { intermediaryTheme } from '@trezor/components';

import { QrCode } from './QrCode';

let mockLoadAttempts = 0;
let mockLoadFails = true;

const settleLoad = () => act(() => new Promise(resolve => setTimeout(resolve, 0)));

jest.mock('./QrCodeInner', () => {
    mockLoadAttempts++;
    if (mockLoadFails) {
        throw new Error('Loading chunk failed');
    }

    return jest.requireActual('./QrCodeInner');
});

const qrCodeTree = (value = 'bc1qexampleaddress') => (
    <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
        <QrCode value={value} centerIcon="icon" data-testid="@qr-code" />
    </ThemeProvider>
);

describe('QrCode when qrcode.react fails to load', () => {
    it('loads once per mount, however often it re-renders', async () => {
        const attemptsBefore = mockLoadAttempts;
        const { rerender } = render(qrCodeTree());
        await settleLoad();

        for (const value of ['bc1qfirst', 'bc1qsecond', 'bc1qthird']) {
            rerender(qrCodeTree(value));
            await settleLoad();
        }

        expect(screen.getByTestId('@qr-code').childElementCount).toBe(0);
        expect(mockLoadAttempts - attemptsBefore).toBe(1);
    });

    it('keeps an empty box, and the next QR code loads again', async () => {
        const attemptsBefore = mockLoadAttempts;
        const { unmount } = render(qrCodeTree());

        await settleLoad();
        expect(screen.getByTestId('@qr-code').childElementCount).toBe(0);
        expect(mockLoadAttempts - attemptsBefore).toBe(1);

        unmount();
        mockLoadFails = false;
        render(qrCodeTree());
        await settleLoad();

        expect(screen.getByTestId('@qr-code').querySelector('svg')).not.toBeNull();
        expect(screen.getByText('icon')).toBeTruthy();
        expect(mockLoadAttempts - attemptsBefore).toBe(2);
    });
});
