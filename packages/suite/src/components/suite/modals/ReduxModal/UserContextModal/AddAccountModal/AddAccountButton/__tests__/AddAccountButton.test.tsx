import '@suite-common/test-utils/src/globalOverrides';

import { type ReactNode } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import { networks } from '@suite-common/wallet-config';
import { getAvailableAccountTypes } from '@suite-common/wallet-utils';

import { AddAccountButton } from '../AddAccountButton';

const mockUseSelector = jest.fn();
const mockUseAccountSearch = jest.fn();
const mockAnalyticsReport = jest.fn();

jest.mock('@suite/intl', () => ({
    Translation: ({ id }: { id: string }) => <span>{id}</span>,
}));

jest.mock('src/hooks/suite', () => ({
    useSelector: (selector: unknown) => mockUseSelector(selector),
    useAccountSearch: () => mockUseAccountSearch(),
}));

jest.mock('src/support/useAnalytics', () => ({
    useAnalytics: () => ({
        report: mockAnalyticsReport,
    }),
}));

jest.mock('../AddButton', () => ({
    AddButton: ({
        disabledMessage,
        onClick,
    }: {
        disabledMessage?: ReactNode;
        onClick: () => void;
    }) => (
        <button data-testid="@add-account" disabled={!!disabledMessage} onClick={onClick}>
            Add account
        </button>
    ),
}));

describe('AddAccountButton', () => {
    beforeEach(() => {
        mockUseSelector.mockReturnValue({ unavailableCapabilities: {} });
        mockUseAccountSearch.mockReturnValue({
            coinFilter: undefined,
            setCoinFilter: jest.fn(),
            setSearchString: jest.fn(),
        });
        mockAnalyticsReport.mockReset();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('allows creating the first Sepolia normal account when only the account definition exists', () => {
        const onEnableAccount = jest.fn();
        const onAddNewAccount = jest.fn();

        render(
            <AddAccountButton
                network={networks.tsep}
                currentAccountDefinition={getAvailableAccountTypes('tsep', { isDebug: false })[0]}
                scopedAccounts={[]}
                onEnableAccount={onEnableAccount}
                onAddNewAccount={onAddNewAccount}
            />,
        );

        const addAccountButton = screen.getByTestId('@add-account');

        expect(addAccountButton).not.toBeDisabled();

        fireEvent.click(addAccountButton);

        expect(onEnableAccount).not.toHaveBeenCalled();
        expect(onAddNewAccount).toHaveBeenCalledTimes(1);
    });

    it('stays disabled when there is no account definition to create', () => {
        render(
            <AddAccountButton
                network={networks.tsep}
                scopedAccounts={[]}
                onEnableAccount={jest.fn()}
                onAddNewAccount={jest.fn()}
            />,
        );

        expect(screen.getByTestId('@add-account')).toBeDisabled();
    });
});
