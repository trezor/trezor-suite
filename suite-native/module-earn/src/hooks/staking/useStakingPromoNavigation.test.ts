import { combineReducers } from '@reduxjs/toolkit';

import { mock } from '@suite-common/dependency-injection';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';
import { getAccountTotalStakingBalance } from '@suite-common/wallet-utils';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import { RootStackRoutes } from '@suite-native/navigation';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { type StaticSessionId } from '@trezor/connect';

import { useStakingPromoNavigation } from './useStakingPromoNavigation';
import { type StakingEarnItem } from '../../types';

const mockNavigate = jest.fn();
const mockShowAlert = jest.fn();
const mockHideAlert = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({ showAlert: mockShowAlert, hideAlert: mockHideAlert }),
}));

jest.mock('../../components/earn/EarnPortfolioTrackerGuard', () => ({
    useEarnPortfolioTrackerGuard: () => ({
        isPortfolioTrackerDevice: false,
        openPortfolioTrackerSheet: jest.fn(),
    }),
}));

jest.mock('@suite-common/wallet-utils', () => ({
    ...jest.requireActual('@suite-common/wallet-utils'),
    getAccountTotalStakingBalance: jest.fn(),
}));

const mockGetAccountTotalStakingBalance = jest.mocked(getAccountTotalStakingBalance);

const staticSessionId: StaticSessionId = 'deviceId@testDevice:1';

const networkSpecificUndelegatedCardano = {
    ...networkSpecificDefaultCardano,
    misc: { staking: { ...networkSpecificDefaultCardano.misc.staking, isActive: false } },
};

const createEthereumAccount = (descriptor: string): Account =>
    mockWalletAccount({
        symbol: asNetworkSymbol('eth'),
        descriptor: asAccountDescriptor(descriptor),
        deviceState: staticSessionId,
    });

const createDelegatedCardanoAccount = (descriptor: string): Account =>
    mockWalletAccount(
        {
            symbol: asNetworkSymbol('ada'),
            descriptor: asAccountDescriptor(descriptor),
            deviceState: staticSessionId,
        },
        networkSpecificDefaultCardano,
    );

const createUndelegatedCardanoAccount = (descriptor: string): Account =>
    mockWalletAccount(
        {
            symbol: asNetworkSymbol('ada'),
            descriptor: asAccountDescriptor(descriptor),
            deviceState: staticSessionId,
        },
        networkSpecificUndelegatedCardano,
    );

const createDevice = (isConnected: boolean) =>
    mockSuiteDevice({ connected: isConnected, remember: true, state: { staticSessionId } });

type BuildStoreParams = {
    accounts: Account[];
    isDeviceConnected: boolean;
};

const buildStore = ({ accounts, isDeviceConnected }: BuildStoreParams) =>
    createLightStore({
        reducer: {
            locale: createStaticReducer({
                appLocaleCode: 'en-US',
                systemLocaleCode: 'en-US',
                isSystemLocaleUsed: true,
                areDebugTranslationKeysDisplayed: false,
            }),
            device: createStaticReducer({
                selectedDevice: createDevice(isDeviceConnected),
                devices: [createDevice(isDeviceConnected)],
            }),
            wallet: combineReducers({
                accounts: createStaticReducer(accounts),
                settings: createStaticReducer({ localCurrency: 'usd', bitcoinAmountUnit: 0 }),
            }),
        },
    });

const renderUseStakingPromoNavigation = async (params: BuildStoreParams) => {
    const services: NativeAnalyticsDep = {
        analytics: mockNativeAnalytics(mock<NativeAnalyticsDep['analytics']['report']>()),
    };

    return await renderHookWithStoreProvider(() => useStakingPromoNavigation(), {
        services: { ...services, store: buildStore(params) },
    });
};

const ethereumItem = { symbol: asNetworkSymbol('eth') } as StakingEarnItem;
const cardanoItem = { symbol: asNetworkSymbol('ada') } as StakingEarnItem;

describe('useStakingPromoNavigation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetAccountTotalStakingBalance.mockReturnValue('0');
    });

    it('offers every account of a manageable network to stake with a connected device', async () => {
        const { result } = await renderUseStakingPromoNavigation({
            accounts: [createEthereumAccount('eth1'), createEthereumAccount('eth2')],
            isDeviceConnected: true,
        });

        await act(() => {
            result.current.handleStakingPromoPress(ethereumItem);
        });

        expect(result.current.chosenAccounts).toHaveLength(2);
        expect(result.current.isChooseAccountViewOnly).toBe(false);
        expect(mockShowAlert).not.toHaveBeenCalled();
    });

    it('asks to enable Cardano when the device has no Cardano account', async () => {
        const { result } = await renderUseStakingPromoNavigation({
            accounts: [createEthereumAccount('eth1')],
            isDeviceConnected: true,
        });

        await act(() => {
            result.current.handleStakingPromoPress(cardanoItem);
        });

        expect(result.current.pendingEnableSymbol).toBe('ada');
        expect(result.current.chosenAccounts).toHaveLength(0);
    });

    it('offers delegated Cardano accounts only for viewing', async () => {
        const { result } = await renderUseStakingPromoNavigation({
            accounts: [
                createDelegatedCardanoAccount('ada1'),
                createDelegatedCardanoAccount('ada2'),
                createUndelegatedCardanoAccount('ada3'),
            ],
            isDeviceConnected: true,
        });

        await act(() => {
            result.current.handleStakingPromoPress(cardanoItem);
        });

        expect(result.current.chosenAccounts).toHaveLength(2);
        expect(result.current.isChooseAccountViewOnly).toBe(true);
    });

    it('offers only the staked accounts for viewing while the device is disconnected', async () => {
        const stakedAccount = createEthereumAccount('staked');
        const unstakedAccount = createEthereumAccount('unstaked');
        const otherStakedAccount = createEthereumAccount('otherStaked');
        mockGetAccountTotalStakingBalance.mockImplementation(account =>
            account.key === unstakedAccount.key ? '0' : '1000000000000000',
        );

        const { result } = await renderUseStakingPromoNavigation({
            accounts: [stakedAccount, unstakedAccount, otherStakedAccount],
            isDeviceConnected: false,
        });

        await act(() => {
            result.current.handleStakingPromoPress(ethereumItem);
        });

        expect(result.current.chosenAccounts).toEqual([stakedAccount, otherStakedAccount]);
        expect(result.current.isChooseAccountViewOnly).toBe(true);
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('opens the positions of a single staked account while the device is disconnected', async () => {
        const stakedAccount = createEthereumAccount('staked');
        mockGetAccountTotalStakingBalance.mockImplementation(account =>
            account.key === stakedAccount.key ? '1000000000000000' : '0',
        );

        const { result } = await renderUseStakingPromoNavigation({
            accounts: [stakedAccount, createEthereumAccount('unstaked')],
            isDeviceConnected: false,
        });

        await act(() => {
            result.current.handleStakingPromoPress(ethereumItem);
        });

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.StakingManagement, {
            accountKey: stakedAccount.key,
        });
        expect(result.current.chosenAccounts).toHaveLength(0);
    });

    it('asks to connect the device when no account is staked while the device is disconnected', async () => {
        const { result } = await renderUseStakingPromoNavigation({
            accounts: [createEthereumAccount('eth1'), createEthereumAccount('eth2')],
            isDeviceConnected: false,
        });

        await act(() => {
            result.current.handleStakingPromoPress(ethereumItem);
        });

        expect(mockShowAlert).toHaveBeenCalledWith(
            expect.objectContaining({
                title: getTranslation('earn.earnScreen.viewOnlyStakingAlert.title'),
                description: getTranslation('earn.earnScreen.viewOnlyStakingAlert.description', {
                    networkName: 'Ethereum',
                }),
            }),
        );
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(result.current.chosenAccounts).toHaveLength(0);
    });

    it('still asks to enable a manageable network without accounts while the device is disconnected', async () => {
        const { result } = await renderUseStakingPromoNavigation({
            accounts: [],
            isDeviceConnected: false,
        });

        await act(() => {
            result.current.handleStakingPromoPress(ethereumItem);
        });

        expect(result.current.pendingEnableSymbol).toBe('eth');
        expect(mockShowAlert).not.toHaveBeenCalled();
    });
});
