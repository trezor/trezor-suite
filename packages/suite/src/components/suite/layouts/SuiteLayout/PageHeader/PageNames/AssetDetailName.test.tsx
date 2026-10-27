import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { mockNetworkIcon, mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/device-utils';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { AssetDetailName } from './AssetDetailName';
import { mockInitialAppState } from '../../../../../../../mocks/mockInitialAppState';

type TokenUrlBlurProps = {
    text?: string;
};

jest.mock('src/components/suite/TokenUrlBlur', () => ({
    TokenUrlBlur: ({ text }: TokenUrlBlurProps) => (
        <span data-testid="@token-url-blur">{text}</span>
    ),
}));

const networkIcon = mockNetworkIcon();

const DEVICE_STATE = '1stTestnetAddress@device_id:0' as StaticSessionId;

const ETH = asNetworkSymbol('eth');

const TOKEN = '0x3a2c4aaae6776dc1c31316de559598f2f952e2cb' as TokenAddress;
const TOKEN_NAME = 'RichQUACK.com';

type GetInitialStateParams = {
    /** Whether the coin definitions vouch for the token, or the user only chose to show it. */
    isTokenRecognized: boolean;
};

const getInitialState = ({ isTokenRecognized }: GetInitialStateParams): AppState => ({
    ...mockInitialAppState,
    networks: mockNetworksState([ETH]),
    device: {
        ...mockInitialAppState.device,
        selectedDevice: mockSuiteDevice({ state: { staticSessionId: DEVICE_STATE } }),
    },
    router: {
        ...mockInitialAppState.router,
        params: { symbol: ETH, contractAddress: TOKEN },
    } as AppState['router'],
    tokenDefinitions: {
        [ETH]: {
            coin: {
                data: isTokenRecognized ? [TOKEN] : [],
                error: false,
                isLoading: false,
                hide: [],
                show: isTokenRecognized ? [] : [TOKEN],
            },
        },
    },
    wallet: {
        ...mockInitialAppState.wallet,
        accounts: [
            mockWalletAccount({
                symbol: ETH,
                tokens: [
                    mockAccountToken({
                        name: TOKEN_NAME,
                        symbol: 'QUACK',
                        contract: TOKEN,
                        balance: '1000',
                    }),
                ],
            }),
        ],
        settings: { ...mockInitialAppState.wallet.settings, enabledNetworks: [ETH] },
    },
});

const renderName = (state: AppState) => {
    const { services } = createTestCompositionRoot<void, AppState>({ preloadedState: state });

    renderWithProviders({ ...services, networks: { networkIcon } }, <AssetDetailName />);
};

describe('the name over the asset screen', () => {
    it('is shown whole for a recognized token, even with a URL in it', () => {
        renderName(getInitialState({ isTokenRecognized: true }));

        expect(screen.getByText(TOKEN_NAME)).toBeInTheDocument();
        expect(screen.queryByTestId('@token-url-blur')).not.toBeInTheDocument();
    });

    it('blurs the URL in it for a token nothing vouches for', () => {
        renderName(getInitialState({ isTokenRecognized: false }));

        expect(screen.getByTestId('@token-url-blur')).toHaveTextContent(TOKEN_NAME);
    });
});
