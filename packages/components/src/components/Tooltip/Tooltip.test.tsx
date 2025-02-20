import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
    it('should show tooltip on hover when isActive is true', async () => {
        const tooltipContent = 'Tooltip Content';
        render(
            <Tooltip delayShow={0} content={tooltipContent} isActive={true}>
                <button>Hover me</button>
            </Tooltip>,
        );

        const trigger = screen.getByText('Hover me');

        await act(async () => {
            await userEvent.hover(trigger);
        });

        const tooltip = screen.getByText(tooltipContent);
        expect(tooltip).toBeInTheDocument();
    });

    it('should show tooltip on hover when isActive is not defined (default behavior)', async () => {
        const tooltipContent = 'Tooltip Content';
        render(
            <Tooltip delayShow={0} content={tooltipContent}>
                <button id="hover-me">Hover me</button>
            </Tooltip>,
        );

        const trigger = screen.getByText('Hover me');

        await act(async () => {
            await userEvent.hover(trigger);
        });

        const tooltip = screen.getByText(tooltipContent);
        expect(tooltip).toBeInTheDocument();
    });

    it('should not show tooltip on hover when isActive is false', async () => {
        const tooltipContent = 'Tooltip Content';
        render(
            <Tooltip delayShow={0} content={tooltipContent} isActive={false}>
                <button>Hover me</button>
            </Tooltip>,
        );

        const trigger = screen.getByText('Hover me');

        await act(async () => {
            await userEvent.hover(trigger);
        });

        const tooltip = screen.queryByText(tooltipContent);
        expect(tooltip).not.toBeInTheDocument();
    });

    it('should hide tooltip when mouse leaves trigger element', async () => {
        const tooltipContent = 'Tooltip Content';
        render(
            <Tooltip isActive delayShow={0} delayHide={0} content={tooltipContent}>
                <button>Hover me</button>
            </Tooltip>,
        );

        const trigger = screen.getByText('Hover me');

        await act(async () => {
            await userEvent.hover(trigger);
        });

        const currentTrigger = screen.getByText('Hover me');
        expect(currentTrigger.parentElement).toHaveAttribute('data-state', 'open');

        await act(async () => {
            await userEvent.unhover(trigger);
        });

        const triggerBefore = screen.getByText('Hover me');
        // NOTE: for some reason, the content is still in the DOM but the state is definitely closed
        const parent = triggerBefore.parentElement;
        expect(parent).toHaveAttribute('data-state', 'closed');
    });

    it('should apply the cursor prop to the content wrapper', () => {
        const tooltipContent = 'Tooltip Content';
        render(
            <Tooltip content={tooltipContent} cursor="pointer">
                <button>Hover me</button>
            </Tooltip>,
        );

        expect(screen.getByText('Hover me').parentElement).toHaveStyle({ cursor: 'pointer' });
    });

    it('should should apply the default=help cursor when the passed cursor is undefined', () => {
        const tooltipContent = 'Tooltip Content';
        render(
            <Tooltip content={tooltipContent} cursor={undefined}>
                <button>Hover me</button>
            </Tooltip>,
        );

        expect(screen.getByText('Hover me').parentElement).toHaveStyle({ cursor: 'help' });
    });
});
