import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
    type ConnectProcessInfo,
    UNKNOWN_PROCESS,
} from '@suite-common/connect-popup/src/connectPopupTypes';

import { ThemeProvider } from 'src/support/suite/ThemeProvider';

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

describe('ConnectProcessLabel', () => {
    it('shows the executable path of a warned-about process', async () => {
        renderLabel({ name: 'node', fullPath: '/tmp/node', warning: true });

        expect(await hoverLabel()).toHaveTextContent('/tmp/node');
    });

    it('says that a warned-about process without a path could not be verified', async () => {
        renderLabel({ name: 'Claude Code', fullPath: '', warning: true });

        expect(await hoverLabel()).toHaveTextContent('TR_CONNECT_PROCESS_UNVERIFIED');
    });

    // Earlier versions remembered an MCP client under the name it declares as its path, and such
    // grants are still listed among the connected apps.
    it('says that a warned-about process whose path is its name could not be verified', async () => {
        renderLabel({ name: 'Claude Code', fullPath: 'Claude Code', warning: true });

        expect(await hoverLabel()).toHaveTextContent('TR_CONNECT_PROCESS_UNVERIFIED');
    });

    it('says that the placeholder for a caller that could not be identified is not verified', async () => {
        renderLabel(UNKNOWN_PROCESS);

        expect(await hoverLabel()).toHaveTextContent('TR_CONNECT_PROCESS_UNVERIFIED');
    });
});
