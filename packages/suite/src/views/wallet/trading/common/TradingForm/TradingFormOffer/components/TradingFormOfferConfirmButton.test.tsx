import { IntlProvider } from 'react-intl';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ThemeProvider } from 'src/support/suite/ThemeProvider';

import { TradingFormOfferConfirmButton } from './TradingFormOfferConfirmButton';

describe('TradingFormOfferConfirmButton', () => {
    it.each([
        { name: 'default', props: {}, isDisabled: false, isLoading: false },
        { name: 'disabled', props: { isDisabled: true }, isDisabled: true, isLoading: false },
        { name: 'loading', props: { isLoading: true }, isDisabled: true, isLoading: true },
        {
            name: 'disabled and loading',
            props: { isDisabled: true, isLoading: true },
            isDisabled: true,
            isLoading: true,
        },
    ])('preserves the $name state', async ({ props, isDisabled, isLoading }) => {
        const onClick = jest.fn();
        const user = userEvent.setup();

        render(
            <ThemeProvider>
                <IntlProvider locale="en" messages={{ TR_CONTINUE: 'TR_CONTINUE' }}>
                    <TradingFormOfferConfirmButton
                        translationId="TR_CONTINUE"
                        testId="@trading/confirm-button"
                        onClick={onClick}
                        {...props}
                    />
                </IntlProvider>
            </ThemeProvider>,
        );

        const button = screen.getByRole('button', { name: 'TR_CONTINUE' });

        if (isDisabled) {
            expect(button).toBeDisabled();
        } else {
            expect(button).toBeEnabled();
        }

        expect(!!screen.queryByTestId('@trading/confirm-button/spinner')).toBe(isLoading);

        await user.click(button);

        expect(onClick).toHaveBeenCalledTimes(isDisabled ? 0 : 1);
    });
});
