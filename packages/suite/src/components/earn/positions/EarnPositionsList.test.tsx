import { fireEvent, render, screen } from '@testing-library/react';

import { ThemeProvider } from '#src/support/suite/ThemeProvider';

import { EarnPositionsList } from './EarnPositionsList';

type TranslationProps = { id: string };

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: TranslationProps) => <span>{id}</span>,
}));

const renderList = (items: readonly string[], refetch = jest.fn()) =>
    render(
        <ThemeProvider>
            <EarnPositionsList
                translationId="TR_EARN_STAKING"
                items={items}
                render={item => <div key={item}>{item}</div>}
                isError
                refetch={refetch}
            />
        </ThemeProvider>,
    );

describe('EarnPositionsList', () => {
    it('shows the load error alone when there are no positions to show', () => {
        renderList([]);

        expect(screen.getByText('TR_EARN_MY_POSITIONS_FAILED_TO_LOAD')).toBeInTheDocument();
        expect(
            screen.queryByText('TR_EARN_MY_POSITIONS_FAILED_TO_REFRESH'),
        ).not.toBeInTheDocument();
    });

    it('keeps the last loaded positions visible when a refresh fails', () => {
        const refetch = jest.fn();
        renderList(['first', 'second'], refetch);

        expect(screen.getByText('TR_EARN_MY_POSITIONS_FAILED_TO_REFRESH')).toBeInTheDocument();
        expect(screen.getByText('first')).toBeInTheDocument();
        expect(screen.getByText('second')).toBeInTheDocument();

        fireEvent.click(screen.getByText('TR_RETRY'));

        expect(refetch).toHaveBeenCalledTimes(1);
    });
});
