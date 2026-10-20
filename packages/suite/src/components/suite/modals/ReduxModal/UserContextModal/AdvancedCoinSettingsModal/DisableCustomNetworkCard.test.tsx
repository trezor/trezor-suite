import '@suite-common/test-utils/globalOverrides';

import { fireEvent, screen, waitFor } from '@testing-library/react';

import { messages } from '@suite/intl';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { getCustomEvmNetworkSymbol } from '@suite-common/wallet-types';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { DisableCustomNetworkCard } from './DisableCustomNetworkCard';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

const mockRemoveCustomEvmNetwork = jest.fn((payload: { symbol: string }) => ({
    type: 'mock/removeCustomEvmNetwork',
    payload,
}));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    removeCustomEvmNetworkThunk: (payload: { symbol: string }) =>
        mockRemoveCustomEvmNetwork(payload),
}));

const symbol = getCustomEvmNetworkSymbol(146);

const renderCard = () => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: mockInitialAppState,
    });
    const onDisabled = jest.fn();

    renderWithProviders(
        services,
        <DisableCustomNetworkCard symbol={symbol} onDisabled={onDisabled} />,
    );

    return { onDisabled };
};

describe('DisableCustomNetworkCard', () => {
    beforeEach(() => {
        mockRemoveCustomEvmNetwork.mockClear();
    });

    it('asks for a confirmation before the network is removed', async () => {
        const { onDisabled } = renderCard();

        fireEvent.click(screen.getByTestId('@settings/advance/disable-network'));

        expect(mockRemoveCustomEvmNetwork).not.toHaveBeenCalled();
        expect(onDisabled).not.toHaveBeenCalled();

        fireEvent.click(screen.getByTestId('@settings/advance/disable-network/confirm'));

        await waitFor(() => expect(onDisabled).toHaveBeenCalledTimes(1));
        expect(mockRemoveCustomEvmNetwork).toHaveBeenCalledWith({ symbol });
    });

    it('keeps the network when the confirmation is cancelled', () => {
        const { onDisabled } = renderCard();

        fireEvent.click(screen.getByTestId('@settings/advance/disable-network'));
        fireEvent.click(screen.getByText(messages.TR_CANCEL.defaultMessage));

        expect(screen.getByTestId('@settings/advance/disable-network')).toBeVisible();
        expect(mockRemoveCustomEvmNetwork).not.toHaveBeenCalled();
        expect(onDisabled).not.toHaveBeenCalled();
    });
});
