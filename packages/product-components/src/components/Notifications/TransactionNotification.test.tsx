import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { intermediaryTheme } from '@trezor/components';

import { TransactionNotification } from './TransactionNotification';

it('renders the supplied icon and approval symbol without resolving a network', () => {
    render(
        <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
            <TransactionNotification
                message="Approval submitted"
                notificationType="tx-approved"
                amount="123"
                displaySymbol="Custom token"
                icon={<span>Custom icon</span>}
                isInfiniteApproval
                unlimitedApprovalLabel="Unlimited"
            />
        </ThemeProvider>,
    );

    expect(screen.getByText('Custom icon')).toBeTruthy();
    expect(screen.getByText('Custom token')).toBeTruthy();
    expect(screen.getByText('Unlimited')).toBeTruthy();
    expect(screen.queryByText('123')).toBeNull();
});
