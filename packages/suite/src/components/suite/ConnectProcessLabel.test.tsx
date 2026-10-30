import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
    type ConnectProcessInfo,
    UNKNOWN_PROCESS,
} from '@suite-common/connect-popup/src/connectPopupTypes';

import { ThemeProvider } from 'src/support/suite/ThemeProvider';

import { ConnectProcessLabel } from './ConnectProcessLabel';

const renderLabel = (process: ConnectProcessInfo) =>
    render(
        <ThemeProvider>
            <ConnectProcessLabel process={process} data-testid="@process" />
        </ThemeProvider>,
    );

// The tooltip the hovered label reveals, or `undefined` when it reveals none.
const hoverLabel = async () => {
    await userEvent.hover(screen.getByTestId('@process'));

    return waitFor(() => screen.getByTestId('@tooltip')).catch(() => undefined);
};

// The icon the badge around the label carries; a warning badge carries the warning icon.
const getBadgeIcon = () =>
    screen
        .getByTestId('@process')
        .closest('[data-component="Badge"]')
        ?.querySelector('[data-component="Icon"]')
        ?.getAttribute('data-icon');

describe('ConnectProcessLabel', () => {
    it('shows an identified process on the neutral badge', async () => {
        renderLabel({ name: 'App', fullPath: '/Applications/App.app/', warning: false });

        expect(getBadgeIcon()).toBe('AppWindow');
        expect(await hoverLabel()).toBeUndefined();
    });

    it('shows the executable path of a warned-about process', async () => {
        renderLabel({ name: 'node', fullPath: '/tmp/node', warning: true });

        expect(getBadgeIcon()).toBe('Warning');
        expect(await hoverLabel()).toHaveTextContent('/tmp/node');
    });

    // Documents the behaviour today: the tooltip of the warning badge is the path, so a caller
    // Suite could not identify gets a warning that explains nothing.
    it('reveals nothing about a warned-about process without a path', async () => {
        renderLabel({ name: 'Claude Code', fullPath: '', warning: true });

        expect(getBadgeIcon()).toBe('Warning');
        expect(await hoverLabel()).toBeUndefined();
    });

    // Documents the behaviour today: the badge follows the warning flag alone, which the Linux
    // lookup never sets, so a process without a path passes for an identified one.
    it('shows a process without a path and without a warning on the neutral badge', async () => {
        renderLabel({ name: 'node', fullPath: '', warning: false });

        expect(getBadgeIcon()).toBe('AppWindow');
        expect(await hoverLabel()).toBeUndefined();
    });

    it('repeats the name of the placeholder for a caller that could not be identified', async () => {
        renderLabel(UNKNOWN_PROCESS);

        expect(getBadgeIcon()).toBe('Warning');
        expect(await hoverLabel()).toHaveTextContent('Unknown');
    });
});
