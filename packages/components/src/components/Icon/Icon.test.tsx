import { type ReactNode, type SVGProps } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

import { Icon } from './Icon';
import { intermediaryTheme } from '../../config/colors';

const renderWithTheme = (children: ReactNode) =>
    render(
        <ThemeProvider theme={{ ...intermediaryTheme.light, variant: 'light' }}>
            {children}
        </ThemeProvider>,
    );

const TestIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg aria-label="test icon" {...props}>
        <path d="M0 0h10v10H0z" />
    </svg>
);

describe('Icon', () => {
    it('renders icon component passed as as prop', () => {
        renderWithTheme(<Icon as={TestIcon} data-testid="@icon/component" size={16} />);

        const icon = screen.getByLabelText('test icon');

        expect(screen.getByTestId('@icon/component')).toHaveStyle({
            width: '16px',
            height: '16px',
        });
        expect(icon).toHaveAttribute('width', '100%');
        expect(icon).toHaveAttribute('height', '100%');
    });

    it('handles click and keyboard events', () => {
        const handleClick = jest.fn();

        renderWithTheme(
            <Icon as={TestIcon} data-testid="@icon/component-click" onClick={handleClick} />,
        );

        fireEvent.click(screen.getByTestId('@icon/component-click'));
        fireEvent.keyDown(screen.getByLabelText('test icon'), { key: 'Enter' });
        fireEvent.keyDown(screen.getByLabelText('test icon'), { key: ' ' });

        expect(handleClick).toHaveBeenCalledTimes(3);
    });
});
