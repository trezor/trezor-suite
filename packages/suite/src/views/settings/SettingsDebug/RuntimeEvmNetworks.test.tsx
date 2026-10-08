import '@suite-common/test-utils/globalOverrides';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { type SuiteSettingsState, suiteSettingsInitialState } from '@suite/settings';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import TrezorConnect from '@trezor/connect';

import { createTestRuntimeEvmNetworkRegistry } from 'src/support/runtimeEvmNetworks/createTestRuntimeEvmNetworkRegistry';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { RuntimeEvmNetworks } from './RuntimeEvmNetworks';

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    __esModule: true,
    default: { blockchainEvmRpcGetChainId: jest.fn() },
}));

type State = { suiteSettings: SuiteSettingsState };

const renderPanel = (isActive = true) => {
    const { services } = createTestCompositionRoot<void, State>({
        reducer: { suiteSettings: (state = suiteSettingsInitialState) => state },
    });
    const runtimeEvmNetworkRegistry = createTestRuntimeEvmNetworkRegistry({ isActive });
    renderWithProviders({ ...services, runtimeEvmNetworkRegistry }, <RuntimeEvmNetworks />);

    return runtimeEvmNetworkRegistry;
};

const fillIn = async (values: Record<string, string>) => {
    const user = userEvent.setup();
    for (const [key, value] of Object.entries(values)) {
        await user.type(screen.getByTestId(`@settings/debug/runtime-evm/input/${key}`), value);
    }
    await user.click(screen.getByTestId('@settings/debug/runtime-evm/add'));

    return user;
};

const network = {
    name: 'Example Chain',
    chainId: '777',
    symbol: 'exc',
    nativeSymbol: 'EXC',
    rpcUrl: 'https://rpc.example.com',
};

describe(RuntimeEvmNetworks.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('asks to turn on queryChainData first', () => {
        renderPanel(false);

        expect(screen.getByText(/Turn on the queryChainData flag/)).toBeInTheDocument();
        expect(screen.queryByTestId('@settings/debug/runtime-evm/add')).not.toBeInTheDocument();
    });

    it('adds a network whose node serves its chain, off until the user turns it on', async () => {
        jest.mocked(TrezorConnect.blockchainEvmRpcGetChainId).mockResolvedValue({
            success: true,
            payload: { chainId: 777 },
        });
        const registry = renderPanel();

        const user = await fillIn(network);

        const item = await screen.findByTestId('@settings/debug/runtime-evm/exc');
        expect(TrezorConnect.blockchainEvmRpcGetChainId).toHaveBeenCalledWith({
            url: 'https://rpc.example.com',
        });
        expect(item).toHaveTextContent('your Ethereum addresses are sent to rpc.example.com');
        expect(registry.getSnapshot()).toMatchObject({
            networks: [{ key: 'user:exc', isEnabled: false }],
            enabledDefinitions: [],
        });

        await user.click(item.querySelector('input[type="checkbox"]')!);

        expect(registry.getSnapshot().enabledDefinitions).toMatchObject([
            { symbol: 'exc', chainId: 777, source: 'user' },
        ]);
    });

    it('refuses a node that serves another chain', async () => {
        jest.mocked(TrezorConnect.blockchainEvmRpcGetChainId).mockResolvedValue({
            success: true,
            payload: { chainId: 1 },
        });
        const registry = renderPanel();

        await fillIn(network);

        await waitFor(() =>
            expect(screen.getByTestId('@settings/debug/runtime-evm/error')).toHaveTextContent(
                'The node serves chain 1, not chain 777.',
            ),
        );
        expect(registry.getSnapshot().networks).toEqual([]);
    });
});
