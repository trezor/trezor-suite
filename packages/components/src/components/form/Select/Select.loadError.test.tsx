import { act, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { Select } from './Select';
import { intermediaryTheme } from '../../../config/colors';

let mockLoadAttempts = 0;

const settleLoad = () => act(() => new Promise(resolve => setTimeout(resolve, 0)));

jest.mock('./SelectInner', () => {
    mockLoadAttempts++;
    throw new Error('Loading chunk failed');
});

const selectTree = (bottomText = 'Pick a fee') => (
    <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
        <Select data-testid="@select" bottomText={bottomText} options={[]} />
    </ThemeProvider>
);

describe('Select when react-select fails to load', () => {
    it('keeps the form cell, and the next Select loads again', async () => {
        const { unmount } = render(selectTree());

        await settleLoad();
        expect(screen.queryByTestId('@select/input')).not.toBeInTheDocument();
        expect(mockLoadAttempts).toBe(1);

        unmount();
        render(selectTree());
        await settleLoad();

        expect(screen.getByText('Pick a fee')).toBeInTheDocument();
        expect(mockLoadAttempts).toBe(2);
    });

    it('loads once per mount, however often it re-renders', async () => {
        const attemptsBefore = mockLoadAttempts;
        const { rerender } = render(selectTree());
        await settleLoad();

        for (const bottomText of ['Fee 1', 'Fee 2', 'Fee 3']) {
            rerender(selectTree(bottomText));
            await settleLoad();
        }

        expect(screen.getByText('Fee 3')).toBeInTheDocument();
        expect(screen.queryByTestId('@select/input')).not.toBeInTheDocument();
        expect(mockLoadAttempts - attemptsBefore).toBe(1);
    });
});
