import { type ComponentProps } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import { ThemeProvider } from 'src/support/suite/ThemeProvider';

import { YieldActionStepWarning } from './YieldActionStepWarning';

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: () => null,
}));

const renderWarning = (props: ComponentProps<typeof YieldActionStepWarning>) =>
    render(
        <ThemeProvider>
            <YieldActionStepWarning {...props} />
        </ThemeProvider>,
    );

describe('YieldActionStepWarning', () => {
    it.each([
        [{}, null],
        [{ isInsufficientFunds: true }, 'insufficient-funds'],
        [{ isApprovalInsufficient: true, isInsufficientFunds: true }, 'approval-too-low'],
        [
            { isApproveOverBalance: true, isApprovalInsufficient: true, isInsufficientFunds: true },
            'approve-over-balance',
        ],
        [
            {
                reserveRecommendation: { amount: '0.01', nativeSymbol: 'ETH' },
                isApproveOverBalance: true,
                isApprovalInsufficient: true,
                isInsufficientFunds: true,
            },
            'reserve-recommendation',
        ],
    ] as const)('preserves warning priority for %j', (props, warning) => {
        renderWarning(props);

        const banners = screen.queryAllByTestId(/^@yield\/warning\//);

        expect(banners).toHaveLength(warning ? 1 : 0);
        if (warning) {
            expect(screen.getByTestId(`@yield/warning/${warning}`)).toBeInTheDocument();
        }
    });

    it('keeps the optional modify-approval action', () => {
        const onModifyApproval = jest.fn();
        const { rerender } = renderWarning({ isApprovalInsufficient: true, onModifyApproval });

        fireEvent.click(screen.getByTestId('@yield/warning/modify-approval-button'));
        expect(onModifyApproval).toHaveBeenCalledTimes(1);

        rerender(
            <ThemeProvider>
                <YieldActionStepWarning isApprovalInsufficient />
            </ThemeProvider>,
        );
        expect(screen.queryByTestId('@yield/warning/modify-approval-button')).toBeNull();
    });
});
