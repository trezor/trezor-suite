import '@suite-common/test-utils/globalOverrides';

import { type ReactNode } from 'react';

import { fireEvent, screen, waitFor } from '@testing-library/react';

import { messages } from '@suite/intl';
import { createTestCompositionRoot } from '@suite-common/test-utils';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';
import { type CatalogueChain } from 'src/utils/settings/customNetworks/viemChainCatalogue';

import { AddCustomNetworkModal } from './AddCustomNetworkModal';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

type VirtualizedListMockProps = {
    items: object[];
    renderItem: (item: object) => ReactNode;
};

const mockChains: CatalogueChain[] = [
    {
        id: 146,
        name: 'Sonic',
        nativeCurrency: { name: 'Sonic', symbol: 'S', decimals: 18 },
        rpcUrls: { default: { http: ['https://rpc.soniclabs.com', 'https://sonic.drpc.org'] } },
        blockExplorers: { default: { url: 'https://sonicscan.org' } },
    },
    {
        id: 5000,
        name: 'Mantle',
        nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 },
        rpcUrls: { default: { http: ['https://rpc.mantle.xyz'] } },
    },
];

jest.mock('src/utils/settings/customNetworks/viemChainCatalogue', () => ({
    ...jest.requireActual('src/utils/settings/customNetworks/viemChainCatalogue'),
    loadViemChainCatalogue: () => Promise.resolve(mockChains),
}));

// Without a layout, jsdom gives the virtualizer an empty viewport, so no row would render.
jest.mock('@trezor/components', () => ({
    ...jest.requireActual('@trezor/components'),
    VirtualizedList: ({ items, renderItem }: VirtualizedListMockProps) => (
        <>
            {items.map((item, index) => (
                <div key={index}>{renderItem(item)}</div>
            ))}
        </>
    ),
}));

// The icon needs the network assets services, which are irrelevant to the modal flow.
jest.mock('@trezor/product-components', () => ({
    ...jest.requireActual('@trezor/product-components'),
    NetworkIcon: () => null,
}));

const renderModal = () => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: mockInitialAppState,
    });
    const onCancel = jest.fn();

    renderWithProviders(services, <AddCustomNetworkModal onCancel={onCancel} />);

    return { onCancel };
};

describe('AddCustomNetworkModal', () => {
    it('lists the supported networks and filters them by the search query', async () => {
        renderModal();

        expect(await screen.findByTestId('@add-custom-network/network/146')).toBeInTheDocument();
        expect(screen.getByTestId('@add-custom-network/network/5000')).toBeInTheDocument();
        expect(screen.getByText(messages.TR_SUPPORTED_EVM_NETWORKS.defaultMessage)).toBeVisible();

        fireEvent.change(screen.getByTestId('@add-custom-network/search'), {
            target: { value: 'mantle' },
        });

        await waitFor(() =>
            expect(screen.queryByTestId('@add-custom-network/network/146')).not.toBeInTheDocument(),
        );
        expect(screen.getByTestId('@add-custom-network/network/5000')).toBeInTheDocument();
    });

    it('opens the detail of the clicked network and goes back to the list', async () => {
        renderModal();

        fireEvent.click(await screen.findByTestId('@add-custom-network/network/146'));

        expect(screen.getByTestId('@add-custom-network/detail')).toBeInTheDocument();
        expect(screen.getByText('146')).toBeVisible();
        expect(screen.getByText('https://sonicscan.org')).toBeVisible();
        expect(screen.getByTestId('@add-custom-network/add-button')).toBeEnabled();

        fireEvent.click(screen.getByTestId('@modal/back-button'));

        expect(await screen.findByTestId('@add-custom-network/list')).toBeInTheDocument();
    });

    it('closes the modal', async () => {
        const { onCancel } = renderModal();

        await screen.findByTestId('@add-custom-network/network/146');
        fireEvent.click(screen.getByTestId('@modal/close-button'));

        expect(onCancel).toHaveBeenCalledTimes(1);
    });
});
