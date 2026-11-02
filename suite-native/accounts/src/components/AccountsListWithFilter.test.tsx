import { type TokenAddress } from '@suite-common/wallet-types';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { AccountsListWithFilter } from './AccountsListWithFilter';

const mockAccountsList = jest.fn();
const mockTokenContract = '0xdac17f958d2ee523a2206206994597c13d831ec7' as TokenAddress;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ getParent: () => undefined }),
}));

// Only the props reaching the list are under test; its own filtering has selector coverage.
jest.mock('./AccountsList/AccountsList', () => ({
    AccountsList: (props: object) => {
        mockAccountsList(props);

        return null;
    },
}));

jest.mock('./SearchableAccountsListHeader', () => ({
    SearchableAccountsListHeader: () => null,
}));

jest.mock('./AccountsListFooter', () => ({
    AccountsListFooter: () => null,
}));

jest.mock('./AccountsList/AccountsListEmptyPlaceholder', () => ({
    AccountsListEmptyPlaceholder: () => null,
}));

describe('AccountsListWithFilter', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('hands the selected token down to the list it filters', async () => {
        await renderWithBasicProvider(
            <AccountsListWithFilter
                title="Send"
                onSelectAccount={jest.fn()}
                networkFilterType="send"
                tokenContract={mockTokenContract}
            />,
        );

        expect(mockAccountsList).toHaveBeenCalledWith(
            expect.objectContaining({ isSendFlow: true, tokenContract: mockTokenContract }),
        );
    });

    it('leaves the token out when the flow has not picked one', async () => {
        await renderWithBasicProvider(
            <AccountsListWithFilter
                title="Send"
                onSelectAccount={jest.fn()}
                networkFilterType="send"
            />,
        );

        expect(mockAccountsList).toHaveBeenCalledWith(
            expect.objectContaining({ isSendFlow: true, tokenContract: undefined }),
        );
    });
});
