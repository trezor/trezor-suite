import { Platform } from 'react-native';

import { PORTFOLIO_TRACKER_DEVICE_ID } from '@suite-common/device';
import {
    Feature as MessageSystemFeature,
    messageSystemInitialState,
} from '@suite-common/message-system';
import type { Feature, Message } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import type { Account, Discovery } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { DeviceModelInternal } from '@trezor/device-utils';

import { bannerFlagsInitialState } from './bannerFlagsSlice';
import { selectPromoBannerConfigErrors, selectVisiblePromoBanners } from './selectors';

const TEST_DEVICE_PATH = 'device-path';
const TEST_SESSION_ID = 'state@device:1' as const;
const nativePromoBannerPlatform = Platform.OS === 'ios' ? 'ios' : 'android';

type CreatePromoFeatureParams = Partial<Feature['payload']> & {
    bannerId: string;
    flag?: boolean;
};

type PromoBannerSelectorState = Parameters<typeof selectVisiblePromoBanners>[0];

const localization = {
    en: 'Placeholder',
    es: 'Placeholder',
    cs: 'Placeholder',
    de: 'Placeholder',
    fr: 'Placeholder',
    pt: 'Placeholder',
};

const createPromoFeature = ({
    bannerId,
    flag = true,
    ...payloadOverrides
}: CreatePromoFeatureParams): Feature => ({
    domain: MessageSystemFeature.banners.dashboard.promo,
    flag,
    payload: {
        bannerId,
        carouselOrder: [
            {
                platform: nativePromoBannerPlatform,
                placement: 'home',
                value: 1,
            },
        ],
        ...payloadOverrides,
    },
});

const createPromoMessage = (
    feature: Feature,
    id = `${feature.domain}-${feature.payload?.bannerId}`,
): Message => ({
    id,
    priority: 1,
    dismissible: true,
    variant: 'info',
    category: 'feature',
    content: localization,
    feature: [feature],
});

const createSelectedDevice = (
    deviceOverrides: Partial<ReturnType<typeof mockSuiteDevice>> = {},
    featureOverrides = {},
) =>
    mockSuiteDevice(
        {
            connected: true,
            available: true,
            remember: true,
            path: TEST_DEVICE_PATH,
            state: { staticSessionId: TEST_SESSION_ID },
            ...deviceOverrides,
        },
        featureOverrides,
    );

const createState = ({
    messages,
    selectedDevice = createSelectedDevice(),
    devices = selectedDevice ? [selectedDevice] : [],
    accounts = [],
    discovery = {
        [TEST_DEVICE_PATH]: {
            status: 'complete',
        },
    } as Discovery,
    bannerFlags = {},
}: {
    messages: Message[];
    selectedDevice?: ReturnType<typeof mockSuiteDevice>;
    devices?: ReturnType<typeof mockSuiteDevice>[];
    accounts?: Account[];
    discovery?: Discovery;
    bannerFlags?: Partial<typeof bannerFlagsInitialState>;
}): PromoBannerSelectorState =>
    ({
        messageSystem: {
            ...messageSystemInitialState,
            config: {
                version: 1,
                timestamp: '2023-01-01',
                sequence: 1,
                actions: messages.map(message => ({
                    conditions: [],
                    message,
                })),
            },
            validMessages: {
                ...messageSystemInitialState.validMessages,
                feature: messages.map(message => message.id),
            },
        },
        device: {
            devices,
            selectedDevice,
        },
        wallet: {
            accounts,
            discovery,
        },
        bannerFlags: {
            ...bannerFlagsInitialState,
            ...bannerFlags,
        },
    }) as PromoBannerSelectorState;

describe('native promo banner selectors', () => {
    it('orders eligible home promo banners for the current native platform', () => {
        const account = mockWalletAccount({
            symbol: asNetworkSymbol('eth'),
            balance: '1',
            deviceState: TEST_SESSION_ID,
            visible: true,
        });
        const state = createState({
            messages: [
                createPromoMessage(
                    createPromoFeature({
                        bannerId: 'ts7',
                        carouselOrder: [
                            {
                                platform: nativePromoBannerPlatform,
                                placement: 'home',
                                value: 3,
                            },
                        ],
                    }),
                    'ts7',
                ),
                createPromoMessage(
                    createPromoFeature({
                        bannerId: 'eth-vault',
                        carouselOrder: [
                            {
                                platform: nativePromoBannerPlatform,
                                placement: 'home',
                                value: 2,
                            },
                        ],
                        eligibility: {
                            required: [{ type: 'asset-balance-positive', value: 'native:eth' }],
                        },
                    }),
                    'eth-vault',
                ),
                createPromoMessage(
                    createPromoFeature({
                        bannerId: 'defi-yield',
                        carouselOrder: [
                            {
                                platform: nativePromoBannerPlatform,
                                placement: 'home',
                                value: 1,
                            },
                        ],
                    }),
                    'defi-yield',
                ),
            ],
            accounts: [account],
        });

        expect(selectVisiblePromoBanners(state)).toEqual(['defi-yield', 'eth-vault', 'ts7']);
    });

    it('applies native local promo filters after remote eligibility is evaluated', () => {
        const selectedDevice = createSelectedDevice(
            {},
            { internal_model: DeviceModelInternal.T3W1 },
        );
        const state = createState({
            selectedDevice,
            messages: [
                createPromoMessage(createPromoFeature({ bannerId: 'ts7' }), 'ts7'),
                createPromoMessage(createPromoFeature({ bannerId: 'defi-yield' }), 'defi-yield'),
                createPromoMessage(createPromoFeature({ bannerId: 'eth-vault' }), 'eth-vault'),
            ],
            bannerFlags: {
                isDefiYieldPromoBannerClosed: true,
            },
        });

        expect(selectVisiblePromoBanners(state)).toEqual(['eth-vault']);
    });

    it('hides wallet-dependent promo banners until native discovery state exists', () => {
        const account = mockWalletAccount({
            symbol: asNetworkSymbol('eth'),
            balance: '1',
            deviceState: TEST_SESSION_ID,
            visible: true,
        });
        const state = createState({
            messages: [
                createPromoMessage(
                    createPromoFeature({
                        bannerId: 'eth-vault',
                        eligibility: {
                            required: [{ type: 'asset-balance-positive', value: 'native:eth' }],
                        },
                    }),
                    'eth-vault',
                ),
            ],
            accounts: [account],
            discovery: {},
        });

        expect(selectVisiblePromoBanners(state)).toEqual([]);
    });

    it('surfaces promo config validation errors from active native feature messages', () => {
        const state = createState({
            messages: [
                createPromoMessage(
                    createPromoFeature({
                        bannerId: 'ts7',
                        carouselOrder: [
                            {
                                platform: nativePromoBannerPlatform,
                                placement: 'home',
                                value: 1,
                            },
                        ],
                    }),
                    'ts7',
                ),
                createPromoMessage(
                    createPromoFeature({
                        bannerId: 'defi-yield',
                        carouselOrder: [
                            {
                                platform: nativePromoBannerPlatform,
                                placement: 'home',
                                value: 1,
                            },
                        ],
                    }),
                    'defi-yield',
                ),
            ],
            selectedDevice: createSelectedDevice({ id: PORTFOLIO_TRACKER_DEVICE_ID }),
        });

        expect(selectPromoBannerConfigErrors(state)).toEqual([
            `Duplicate promo banner carouselOrder 1 for placement "home" and platform "${nativePromoBannerPlatform}": defi-yield, ts7.`,
        ]);
    });
});
