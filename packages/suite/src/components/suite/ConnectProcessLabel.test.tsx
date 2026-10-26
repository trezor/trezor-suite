import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { type ConnectProcessInfo } from '@suite-common/connect-popup/src/connectPopupTypes';

import { ThemeProvider } from 'src/support/suite/ThemeProvider';

import { ConnectProcessLabel } from './ConnectProcessLabel';

type TranslationProps = { id: string; values?: Record<string, string> };

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id, values }: TranslationProps) => (
        <span>{[id, ...Object.values(values ?? {})].join(' ')}</span>
    ),
}));

const renderLabel = (process: ConnectProcessInfo) =>
    render(
        <ThemeProvider>
            <ConnectProcessLabel process={process} data-testid="@process" />
        </ThemeProvider>,
    );

const hoverLabel = async () => {
    await userEvent.hover(screen.getByTestId('@process'));

    return waitFor(() => screen.getByTestId('@tooltip'));
};

describe('ConnectProcessLabel', () => {
    it('shows the executable path of a process that is not warned about', async () => {
        renderLabel({ name: 'node', fullPath: '/usr/local/bin/node', warning: false });

        expect(await hoverLabel()).toHaveTextContent('/usr/local/bin/node');
    });

    it('shows the executable path of a warned-about process', async () => {
        renderLabel({ name: 'node', fullPath: '/tmp/node', warning: true });

        expect(await hoverLabel()).toHaveTextContent('/tmp/node');
    });

    it('says the path could not be read instead of showing nothing', async () => {
        renderLabel({ name: 'node', fullPath: '', warning: true });

        expect(await hoverLabel()).toHaveTextContent('TR_CONNECT_PROCESS_PATH_UNKNOWN');
    });

    it('names the process the lookup observed when the path could not be read', async () => {
        renderLabel({ name: 'Claude Code', observedName: 'node', fullPath: '', warning: true });

        expect(await hoverLabel()).toHaveTextContent('TR_CONNECT_PROCESS_RUNS_AS node');
    });
});
