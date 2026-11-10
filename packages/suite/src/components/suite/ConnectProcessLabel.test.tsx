import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
    type ConnectProcessInfo,
    UNKNOWN_PROCESS,
} from '@suite-common/connect-popup/src/connectPopupTypes';

import { ThemeProvider } from '#src/support/suite/ThemeProvider';

import { ConnectProcessLabel } from './ConnectProcessLabel';

type TranslationProps = { id: string };

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: TranslationProps) => <span>{id}</span>,
}));

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
    it('shows the path of an identified process on the neutral badge', async () => {
        renderLabel({ name: 'App', fullPath: '/Applications/App.app/', warning: false });

        expect(getBadgeIcon()).toBe('AppWindow');
        expect(await hoverLabel()).toHaveTextContent('/Applications/App.app/');
    });

    it('shows the executable path of a warned-about process', async () => {
        renderLabel({ name: 'node', fullPath: '/tmp/node', warning: true });

        expect(getBadgeIcon()).toBe('Warning');
        expect(await hoverLabel()).toHaveTextContent('/tmp/node');
    });

    // On macOS the path is argv[0], a bare name for anything started from PATH.
    it('shows no path that only repeats the name on the badge', async () => {
        renderLabel({ name: 'node', fullPath: 'node', warning: true });

        expect(getBadgeIcon()).toBe('Warning');
        expect(await hoverLabel()).toBeUndefined();
    });

    it('says that a warned-about process without a path could not be identified', async () => {
        renderLabel({ name: 'Claude Code', fullPath: '', warning: true });

        expect(getBadgeIcon()).toBe('Warning');
        expect(await hoverLabel()).toHaveTextContent('TR_CONNECT_PROCESS_UNIDENTIFIED');
    });

    // A process without a path is warned about whatever warning flag it carries.
    it('warns about a process without a path even when it carries no warning', async () => {
        renderLabel({ name: 'node', fullPath: '', warning: false });

        expect(getBadgeIcon()).toBe('Warning');
        expect(await hoverLabel()).toHaveTextContent('TR_CONNECT_PROCESS_UNIDENTIFIED');
    });

    it('says that the placeholder for a caller that could not be identified is not identified', async () => {
        renderLabel(UNKNOWN_PROCESS);

        expect(getBadgeIcon()).toBe('Warning');
        expect(await hoverLabel()).toHaveTextContent('TR_CONNECT_PROCESS_UNIDENTIFIED');
    });
});
