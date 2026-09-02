import { type NavigationAction, type RouteProp } from '@react-navigation/native';

import { selectTradingExchangeSelectedQuote, tradingExchangeActions } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    useNavigationRemoveActionInterceptor,
} from '@suite-native/navigation';
import { type TestStore } from '@suite-native/test-utils-store';
import { eth1NormalAccount, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import { TradingExchangeRevokeScreen } from './TradingExchangeRevokeScreen';
import { createTradingLightStore, renderWithTradingProvider } from '../test-utils/tradingTestUtils';

const mockShowSheet = jest.fn();
const mockHideSheet = jest.fn();
const mockConfirmApproval = jest.fn().mockResolvedValue({});
const mockNavigationDispatch = jest.fn();

jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    useNavigationRemoveActionInterceptor: jest.fn(),
}));

const mockedUseNavigationRemoveActionInterceptor = jest.mocked(
    useNavigationRemoveActionInterceptor,
);

const triggerPreventNavigationRemove = (action: NavigationAction = { type: 'GO_BACK' }) => {
    const params = mockedUseNavigationRemoveActionInterceptor.mock.calls.at(-1)?.[0];

    params?.onInterceptedAction?.(action);
};

jest.mock('../hooks/exchange/Approval/useApprovalFlow', () => ({
    useApprovalFlow: () => ({
        quote: undefined,
        isReady: true,
        isConfirming: false,
        error: null,
        confirmApproval: mockConfirmApproval,
    }),
}));

jest.mock('../hooks/exchange/Approval/useEvmApprovalFees', () => ({
    useEvmApprovalFees: () => ({
        fee: '100000',
        isLoading: false,
        error: null,
        composeFees: jest.fn(),
    }),
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () =>
        ({
            key: RootStackRoutes.TradingExchangeRevoke,
            name: RootStackRoutes.TradingExchangeRevoke,
            params: {},
        }) as RouteProp<RootStackParamList, RootStackRoutes.TradingExchangeRevoke>,
    useNavigation: () => ({
        setOptions: jest.fn(),
    }),
}));

jest.mock('@suite-native/atoms', () => ({
    ...jest.requireActual('@suite-native/atoms'),
    useBottomSheetControls: () => ({
        isSheetVisible: false,
        showSheet: mockShowSheet,
        hideSheet: mockHideSheet,
    }),
}));

let mockIsDeviceConnected = true;
jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectIsDeviceConnected: () => mockIsDeviceConnected,
}));

const mockAnalyticsReport = jest.fn();
jest.mock('@suite-native/trading-analytics', () => ({
    ...jest.requireActual('@suite-native/trading-analytics'),
    useExchangeAnalyticsStepReport:
        (action: unknown) =>
        (...args: unknown[]) =>
            mockAnalyticsReport(action, ...args),
}));

const testQuote = mercuryoFixedWorstQuote;

describe('TradingExchangeRevokeScreen', () => {
    let store: TestStore;
    let unmount: (() => void) | undefined;

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const renderScreen = async (params: Record<string, unknown> = {}) => {
        const result = await renderWithTradingProvider(
            <TradingExchangeRevokeScreen
                route={{ params } as any}
                navigation={{ dispatch: mockNavigationDispatch } as any}
            />,
            { store, tradeType: 'exchange' },
        );

        ({ unmount } = result);

        return result;
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockIsDeviceConnected = true;

        store = createTradingLightStore({ tradeType: 'exchange' });
        store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
        store.dispatch(tradingExchangeActions.setTradingAccountKey(eth1NormalAccount.key));
    });

    afterEach(async () => {
        if (unmount) {
            await unmount();
            unmount = undefined;
        }
    });

    it('should confirm revoke with ZERO approval type', async () => {
        await renderScreen();

        expect(mockConfirmApproval).toHaveBeenCalledTimes(1);
        expect(mockConfirmApproval).toHaveBeenCalledWith(
            expect.objectContaining({ approvalType: 'ZERO' }),
        );
    });

    it('should render the revoke screen with quote details', async () => {
        const { getByText } = await renderScreen();

        expect(getByText('ETH Account #1')).toBeOnTheScreen();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should display provider information correctly', async () => {
        const { getByText } = await renderScreen();

        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });

    it('should render continue button', async () => {
        const { getByText } = await renderScreen();

        expect(getByText(getTranslation('generic.buttons.continue'))).toBeOnTheScreen();
    });

    it('should render alert when no quote is provided', async () => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote(undefined));

        const { getByText, queryByText } = await renderScreen();

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangeRevokeScreen.revokeErrorAlert')),
        ).toBeOnTheScreen();
        expect(queryByText(getTranslation('generic.buttons.continue'))).toBeNull();
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith('No quote to revoke approval');
    });

    it('should clear selected quote on back navigation', async () => {
        store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
        await renderScreen();

        const backAction: NavigationAction = { type: 'GO_BACK' };

        triggerPreventNavigationRemove(backAction);

        const selectedQuote = selectTradingExchangeSelectedQuote(store.getState());
        expect(selectedQuote).toBeUndefined();
        expect(mockNavigationDispatch).toHaveBeenCalledWith(backAction);
    });

    it('should render low limit info alert when shouldIncreaseLimit is true', async () => {
        const { getByText } = await renderScreen({ shouldIncreaseLimit: true });

        expect(
            getByText(
                getTranslation('moduleTrading.tradingExchangeRevokeScreen.lowLimitInfoAlert'),
            ),
        ).toBeOnTheScreen();
    });

    it('should display device guard when device is not connected', async () => {
        mockIsDeviceConnected = false;

        const { getByText } = await renderScreen();

        expect(
            getByText(getTranslation('moduleConnectDevice.connectAndUnlockScreen.title')),
        ).toBeOnTheScreen();
    });

    describe('analytics', () => {
        it('should report revoke-preview visit ', async () => {
            await renderScreen();

            expect(mockAnalyticsReport).toHaveBeenCalledWith('revoke-preview', 'visit');
            expect(mockAnalyticsReport).toHaveBeenCalledTimes(1);
        });

        it('should report revoke-preview cancel on back navigation', async () => {
            store.dispatch(tradingExchangeActions.saveSelectedQuote(testQuote));
            await renderScreen();

            triggerPreventNavigationRemove({ type: 'GO_BACK' });

            expect(mockAnalyticsReport).toHaveBeenCalledWith('revoke-preview', 'cancel');
        });
    });
});
