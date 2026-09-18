import { DeviceModelInternal } from '@trezor/device-utils';

import { type Feature, type Message } from '@suite-common/suite-types';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    parsePromoBannerMessages,
    selectEligiblePromoBanners,
    type PromoBannerFeatureConfig,
} from './promoBannerUtils';
import { Feature as MessageSystemFeature } from './messageSystemTypes';

const localization = {
    en: 'Placeholder',
    es: 'Placeholder',
    cs: 'Placeholder',
    de: 'Placeholder',
    fr: 'Placeholder',
    pt: 'Placeholder',
};

type CreatePromoFeatureParams = Partial<Feature['payload']> & { bannerId: string };

const createPromoFeature = ({
    bannerId,
    ...payloadOverrides
}: CreatePromoFeatureParams): Feature => ({
    domain: MessageSystemFeature.banners.dashboard.promo,
    flag: true,
    payload: {
        bannerId,
        carouselOrder: [
            {
                platform: 'web',
                placement: 'dashboard',
                value: 1,
            },
        ],
        ...payloadOverrides,
    },
});

const createPromoMessage = (feature: Feature, id = feature.domain): Message => ({
    id,
    priority: 1,
    dismissible: true,
    variant: 'info',
    category: 'feature',
    content: localization,
    feature: [feature],
});

const selectVisiblePromoBanners = ({
    promoBanners,
    accounts = [],
    isWalletDiscoveryFinished = true,
    isPortfolioTrackerOnly = false,
    selectedDevice = null,
    reportError,
}: {
    promoBanners: PromoBannerFeatureConfig[];
    accounts?: Parameters<typeof selectEligiblePromoBanners>[0]['accounts'];
    isWalletDiscoveryFinished?: boolean;
    isPortfolioTrackerOnly?: boolean;
    selectedDevice?: Parameters<typeof selectEligiblePromoBanners>[0]['selectedDevice'];
    reportError?: Parameters<typeof selectEligiblePromoBanners>[0]['reportError'];
}) =>
    selectEligiblePromoBanners({
        promoBanners,
        platform: 'web',
        placement: 'dashboard',
        accounts,
        isWalletDiscoveryFinished,
        isPortfolioTrackerOnly,
        selectedDevice,
        reportError,
    });

describe(parsePromoBannerMessages.name, () => {
    it('reports duplicate carousel order values for the same placement and platform', () => {
        const messages = [
            createPromoMessage(
                createPromoFeature({
                    bannerId: 'ts7',
                    carouselOrder: [{ platform: 'web', placement: 'dashboard', value: 1 }],
                }),
                'ts7-message',
            ),
            createPromoMessage(
                createPromoFeature({
                    bannerId: 'defi-yield',
                    carouselOrder: [{ platform: 'web', placement: 'dashboard', value: 1 }],
                }),
                'defi-message',
            ),
        ];

        const { errors, promoBanners } = parsePromoBannerMessages(messages);

        expect(errors).toEqual([
            'Duplicate promo banner carouselOrder 1 for placement "dashboard" and platform "web": defi-yield, ts7.',
        ]);
        expect(promoBanners).toHaveLength(2);
    });

    it('rejects an unknown promo banner identifier', () => {
        const { errors, promoBanners } = parsePromoBannerMessages([
            createPromoMessage(createPromoFeature({ bannerId: 'unknown-banner' })),
        ]);

        expect(errors).toEqual(['Unknown promo banner id "unknown-banner".']);
        expect(promoBanners).toEqual([]);
    });
});

describe(selectEligiblePromoBanners.name, () => {
    it('shows a banner when any discovered account has a positive balance of the required asset', () => {
        const { promoBanners } = parsePromoBannerMessages([
            createPromoMessage(
                createPromoFeature({
                    bannerId: 'eth-vault',
                    eligibility: {
                        required: [{ type: 'asset-balance-positive', value: 'native:eth' }],
                    },
                }),
            ),
        ]);

        const accounts = [
            mockWalletAccount({ symbol: asNetworkSymbol('eth'), balance: '0' }),
            mockWalletAccount({ symbol: asNetworkSymbol('eth'), balance: '1' }),
        ];

        expect(selectVisiblePromoBanners({ promoBanners, accounts })).toEqual(['eth-vault']);
    });

    it('hides wallet-dependent banners before discovery completes', () => {
        const { promoBanners } = parsePromoBannerMessages([
            createPromoMessage(
                createPromoFeature({
                    bannerId: 'eth-vault',
                    eligibility: {
                        required: [{ type: 'asset-balance-positive', value: 'native:eth' }],
                    },
                }),
            ),
        ]);

        const accounts = [mockWalletAccount({ symbol: asNetworkSymbol('eth'), balance: '1' })];

        expect(
            selectVisiblePromoBanners({
                promoBanners,
                accounts,
                isWalletDiscoveryFinished: false,
            }),
        ).toEqual([]);
    });

    it('matches alternative eligibility states using product positions', () => {
        const receiptTokenContract = '0x1111111111111111111111111111111111111111';
        const { promoBanners } = parsePromoBannerMessages([
            createPromoMessage(
                createPromoFeature({
                    bannerId: 'defi-yield',
                    eligibility: {
                        alternatives: [
                            [{ type: 'asset-balance-positive', value: 'native:eth' }],
                            [
                                {
                                    type: 'product-position-positive',
                                    value: `yield:eth:${receiptTokenContract}`,
                                },
                            ],
                        ],
                    },
                }),
            ),
        ]);

        const accounts = [
            mockWalletAccount({
                symbol: asNetworkSymbol('eth'),
                balance: '0',
                tokens: [mockAccountToken({ contract: receiptTokenContract, balance: '5' })],
            }),
        ];

        expect(selectVisiblePromoBanners({ promoBanners, accounts })).toEqual(['defi-yield']);
        expect(selectVisiblePromoBanners({ promoBanners, accounts: [] })).toEqual([]);
    });

    it('uses a stable banner-id fallback order when eligible banners share the same carousel order', () => {
        const { promoBanners } = parsePromoBannerMessages([
            createPromoMessage(
                createPromoFeature({
                    bannerId: 'eth-vault',
                    carouselOrder: [{ platform: 'web', placement: 'dashboard', value: 1 }],
                }),
                'eth-vault-message',
            ),
            createPromoMessage(
                createPromoFeature({
                    bannerId: 'defi-yield',
                    carouselOrder: [{ platform: 'web', placement: 'dashboard', value: 1 }],
                }),
                'defi-yield-message',
            ),
            createPromoMessage(
                createPromoFeature({
                    bannerId: 'ts7',
                    carouselOrder: [{ platform: 'web', placement: 'dashboard', value: 2 }],
                }),
                'ts7-message',
            ),
        ]);
        const reportError = jest.fn();

        const visiblePromoBanners = selectVisiblePromoBanners({
            promoBanners,
            selectedDevice: mockSuiteDevice({}, { internal_model: DeviceModelInternal.T3T1 }),
            reportError,
        });

        expect(visiblePromoBanners).toEqual(['defi-yield', 'eth-vault', 'ts7']);
        expect(reportError).toHaveBeenCalledWith(
            'Duplicate promo banner carouselOrder reached runtime for placement "dashboard" and platform "web": defi-yield, eth-vault.',
        );
    });
});
