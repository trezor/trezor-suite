import { type ReactNode } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { type DropdownMenuItemProps, Menu } from './Menu';
import { intermediaryTheme } from '../../config/colors';

const theme = { ...intermediaryTheme.light, variant: 'light' } as const;

const renderWithTheme = (children: ReactNode) =>
    render(<ThemeProvider theme={theme}>{children}</ThemeProvider>);

const pressKey = (key: string) => fireEvent.keyDown(document, { key });

describe('Menu', () => {
    it('neither closes nor runs an item on Enter when every item is disabled', () => {
        const onClose = jest.fn();
        const onClick = jest.fn();
        renderWithTheme(
            <Menu
                onClose={onClose}
                items={[
                    { label: 'First', isDisabled: true, onClick },
                    { label: 'Second', isDisabled: true, onClick },
                ]}
            />,
        );

        pressKey('Enter');

        expect(onClose).not.toHaveBeenCalled();
        expect(onClick).not.toHaveBeenCalled();
    });

    it('ignores the arrow keys when every item is disabled', () => {
        const onClick = jest.fn();
        renderWithTheme(
            <Menu
                items={[
                    { label: 'First', isDisabled: true, onClick },
                    { label: 'Second', isDisabled: true, onClick },
                ]}
            />,
        );

        pressKey('ArrowDown');
        pressKey('ArrowUp');
        pressKey('Enter');

        expect(onClick).not.toHaveBeenCalled();
    });

    it('skips disabled items with the arrow keys', () => {
        const onFirstClick = jest.fn();
        const onThirdClick = jest.fn();
        renderWithTheme(
            <Menu
                items={[
                    { label: 'First', onClick: onFirstClick },
                    { label: 'Second', isDisabled: true },
                    { label: 'Third', onClick: onThirdClick },
                ]}
            />,
        );

        pressKey('ArrowDown');
        pressKey('Enter');

        expect(onThirdClick).toHaveBeenCalledTimes(1);
        expect(onFirstClick).not.toHaveBeenCalled();
    });

    it('takes keyboard input once an item of an all-disabled list becomes enabled', () => {
        const onSecondClick = jest.fn();
        const { rerender } = renderWithTheme(
            <Menu
                items={[
                    { label: 'First', isDisabled: true },
                    { label: 'Second', isDisabled: true },
                ]}
            />,
        );

        rerender(
            <ThemeProvider theme={theme}>
                <Menu
                    items={[
                        { label: 'First', isDisabled: true },
                        { label: 'Second', onClick: onSecondClick },
                    ]}
                />
            </ThemeProvider>,
        );

        pressKey('ArrowDown');
        pressKey('Enter');

        expect(onSecondClick).toHaveBeenCalledTimes(1);
    });

    it('does not hang when the focused item left a list of disabled items', () => {
        const enabledItems: DropdownMenuItemProps[] = [
            { label: 'First' },
            { label: 'Second' },
            { label: 'Third' },
        ];
        const { rerender } = renderWithTheme(<Menu items={enabledItems} />);

        fireEvent.mouseEnter(screen.getByText('Third'));
        rerender(
            <ThemeProvider theme={theme}>
                <Menu
                    items={[
                        { label: 'First', isDisabled: true },
                        { label: 'Second', isDisabled: true },
                    ]}
                />
            </ThemeProvider>,
        );

        pressKey('ArrowDown');

        expect(screen.getByText('First')).toBeInTheDocument();
    });

    it('moves the focus to the first enabled item once the focused one becomes disabled', () => {
        const onFirstClick = jest.fn();
        const onSecondClick = jest.fn();
        const { rerender } = renderWithTheme(
            <Menu
                items={[
                    { label: 'First', onClick: onFirstClick },
                    { label: 'Second', onClick: onSecondClick },
                ]}
            />,
        );

        fireEvent.mouseEnter(screen.getByText('Second'));
        rerender(
            <ThemeProvider theme={theme}>
                <Menu
                    items={[
                        { label: 'First', onClick: onFirstClick },
                        { label: 'Second', isDisabled: true, onClick: onSecondClick },
                    ]}
                />
            </ThemeProvider>,
        );

        pressKey('Enter');

        expect(onSecondClick).not.toHaveBeenCalled();
        expect(onFirstClick).toHaveBeenCalledTimes(1);
    });
});
