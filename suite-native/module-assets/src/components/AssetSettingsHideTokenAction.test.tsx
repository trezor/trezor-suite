import { selectWalletAssetHiddenReason } from '@suite-common/assets';
import {
    DefinitionType,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { type TokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Alert } from '@suite-native/alerts';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import {
    createStoreFromPreloadedState,
    fireEvent,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils-store';

import { AssetSettingsHideTokenAction } from './AssetSettingsHideTokenAction';

const mockShowAlert = jest.fn<void, [Alert]>();
const mockReport = jest.fn();

jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({ showAlert: mockShowAlert, hideAlert: jest.fn() }),
}));

jest.mock('@suite-native/toasts', () => ({
    useToast: () => ({ showToast: jest.fn() }),
}));

jest.mock('@suite-common/assets', () => ({
    selectWalletAssetKey: () => 'asset-key',
    selectWalletAssetHiddenReason: jest.fn(),
    selectWalletAssetDisplaySymbol: () => 'SCAM',
}));

const ETH = asNetworkSymbol('eth');
const TOKEN_CONTRACT = '0x1234567890123456789012345678901234567890' as TokenAddress;
const SHOW_TOKEN_BUTTON = '@asset-detail/settings/show-token-button';

const showTokenAction = tokenDefinitionsActions.setTokenStatus({
    symbol: ETH,
    contractAddress: TOKEN_CONTRACT,
    status: TokenManagementAction.SHOW,
    type: DefinitionType.COIN,
});

const showTokenEvent = {
    type: 'assets/actions',
    payload: { action: 'show-token', networkSymbol: ETH, contractAddress: TOKEN_CONTRACT },
};

const LOADED_DEFINITIONS = { [ETH]: { coin: { data: [], hide: [], show: [] } } };

const renderAction = async (tokenDefinitions: object = LOADED_DEFINITIONS) => {
    const store = createStoreFromPreloadedState({ tokenDefinitions });
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const onClose = jest.fn();

    await renderWithStoreProvider(
        <AssetSettingsHideTokenAction
            networkSymbol={ETH}
            tokenContract={TOKEN_CONTRACT}
            onClose={onClose}
        />,
        { services: { store, analytics: mockNativeAnalytics(mockReport) } },
    );

    return { dispatchSpy, onClose };
};

describe('AssetSettingsHideTokenAction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('asks for confirmation before showing an unrecognized token', async () => {
        jest.mocked(selectWalletAssetHiddenReason).mockReturnValue('unrecognized');
        const { dispatchSpy, onClose } = await renderAction();

        fireEvent.press(screen.getByTestId(SHOW_TOKEN_BUTTON));

        expect(onClose).toHaveBeenCalled();
        expect(mockShowAlert).toHaveBeenCalled();
        expect(dispatchSpy).not.toHaveBeenCalledWith(showTokenAction);
        expect(mockReport).not.toHaveBeenCalled();

        mockShowAlert.mock.lastCall?.[0].onPressPrimaryButton?.();

        expect(dispatchSpy).toHaveBeenCalledWith(showTokenAction);
        expect(mockReport).toHaveBeenCalledWith(showTokenEvent);
    });

    it('offers no visibility action before the coin definitions load', async () => {
        jest.mocked(selectWalletAssetHiddenReason).mockReturnValue('unrecognized');
        await renderAction({});

        expect(screen.queryByTestId(SHOW_TOKEN_BUTTON)).toBeNull();
        expect(screen.queryByTestId('@asset-detail/settings/hide-token-button')).toBeNull();
    });

    it('shows a token the user hid without asking', async () => {
        jest.mocked(selectWalletAssetHiddenReason).mockReturnValue('hiddenByUser');
        const { dispatchSpy } = await renderAction();

        fireEvent.press(
            screen.getByText(getTranslation('moduleAccountManagement.tokenSettings.showToken')),
        );

        expect(mockShowAlert).not.toHaveBeenCalled();
        expect(dispatchSpy).toHaveBeenCalledWith(showTokenAction);
        expect(mockReport).toHaveBeenCalledWith(showTokenEvent);
    });
});
