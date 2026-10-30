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

describe('ConnectProcessLabel', () => {
    it('shows the executable path of a warned-about process', async () => {
        renderLabel({ name: 'node', fullPath: '/tmp/node', warning: true });

        expect(await hoverLabel()).toHaveTextContent('/tmp/node');
    });

    // Documents the behaviour today: the tooltip of the warning badge is the path, so a caller
    // Suite could not identify gets a warning that explains nothing.
    it('reveals nothing about a warned-about process without a path', async () => {
        renderLabel({ name: 'Claude Code', fullPath: '', warning: true });

        expect(await hoverLabel()).toBeUndefined();
    });

    // Earlier versions remembered an MCP client under the name it declares as its path, and such
    // grants are still listed among the connected apps.
    it('repeats the name of a warned-about process whose path is its name', async () => {
        renderLabel({ name: 'Claude Code', fullPath: 'Claude Code', warning: true });

        expect(await hoverLabel()).toHaveTextContent('Claude Code');
    });

    it('repeats the name of the placeholder for a caller that could not be identified', async () => {
        renderLabel(UNKNOWN_PROCESS);

        expect(await hoverLabel()).toHaveTextContent('Unknown');
    });
});
