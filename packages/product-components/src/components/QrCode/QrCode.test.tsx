import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { intermediaryTheme } from '@trezor/components';

import { QrCode } from './QrCode';

const renderQrCode = (centerIcon?: string) =>
    render(
        <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
            <QrCode value="bc1qexampleaddress" centerIcon={centerIcon} data-testid="@qr-code" />
        </ThemeProvider>,
    );

describe('QrCode', () => {
    it('renders the box at once and the QR code once qrcode.react has loaded', async () => {
        renderQrCode('icon');

        const box = screen.getByTestId('@qr-code');
        await waitFor(() => expect(box.querySelector('svg')).not.toBeNull());
        expect(screen.getByText('icon')).toBeTruthy();
    });
});
