import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { prepareFlagsReducer } from '@suite/flags';
import { Feature } from '@suite-common/message-system';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { type MessageSystem } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { DeviceModelInternal } from '@trezor/device-utils';
import { type WithServices } from '@trezor/redux-utils';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { DashboardPromoBanner } from './DashboardPromoBanner';
import { blackFridayHolidayBannerTypes } from './dashboardBannerTypes';
import { mockInitialAppState } from '../../../../mocks/mockInitialAppState';

const flagsReducer = prepareFlagsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadFlags: mockReducer() },
});

const config: MessageSystem = {
    version: 1,
    timestamp: '2026-11-02T00:00:00Z',
    sequence: 1,
    actions: blackFridayHolidayBannerTypes.map((bannerType, index) => ({
        conditions: [],
        message: {
            id: bannerType,
            priority: 7 - index,
            dismissible: true,
            variant: 'info',
            category: 'feature',
            content: { en: 'Placeholder' },
            feature: [
                { domain: Feature.banners.dashboard.promo, visibleBanner: bannerType, flag: true },
            ],
        },
    })),
};

describe('DashboardPromoBanner targeting', () => {
    it.each([
        {
            model: DeviceModelInternal.T3W1,
            expectedBanners: [
                'bfh26-ts7-accessory-pack',
                'bfh26-keep-metal',
                'bfh26-ts3-gift',
                'bfh26-ts3-backup',
                'bfh26-ts7-complete-kit',
                'bfh26-egift-card',
            ],
        },
        {
            model: DeviceModelInternal.T3B1,
            expectedBanners: [
                'bfh26-keep-metal',
                'bfh26-ts3-gift',
                'bfh26-ts7-complete-kit',
                'bfh26-egift-card',
                'bfh26-ts7-upgrade',
            ],
        },
    ] as const)(
        'targets $model and links every offer to holiday deals',
        async ({ model, expectedBanners }) => {
            const btc = asNetworkSymbol('btc');
            const initialState: AppState = {
                ...mockInitialAppState,
                networks: mockNetworksState([btc]),
                device: {
                    ...mockInitialAppState.device,
                    selectedDevice: mockSuiteDevice(
                        { remember: true, connected: false },
                        {
                            internal_model: model,
                            capabilities: ['Capability_Bitcoin'],
                        },
                    ),
                },
                wallet: {
                    ...mockInitialAppState.wallet,
                    settings: { ...mockInitialAppState.wallet.settings, enabledNetworks: [btc] },
                },
                messageSystem: {
                    ...mockInitialAppState.messageSystem,
                    config,
                    validMessages: {
                        ...mockInitialAppState.messageSystem.validMessages,
                        feature: [...blackFridayHolidayBannerTypes],
                    },
                },
            };
            const { services } = createTestCompositionRoot<
                WithServices<DesktopAnalyticsDep>,
                AppState
            >({
                preloadedState: initialState,
                reducer: (state = initialState, action) => ({
                    ...state,
                    flags: flagsReducer(state.flags, action),
                }),
                services: () => ({ analytics: mockDesktopAnalytics() }),
            });

            renderWithProviders(services, <DashboardPromoBanner />);

            expect(screen.getAllByRole('button', { name: /Show promo banner/ })).toHaveLength(
                expectedBanners.length,
            );

            for (const [index, bannerType] of expectedBanners.entries()) {
                await userEvent.click(
                    screen.getByTestId(`@dashboard/promo-banner/carousel-indicator-${index}`),
                );
                const cta = await screen.findByTestId(
                    `@dashboard/promo-banner/${bannerType}/button`,
                );
                const href = new URL(cta.getAttribute('href')!);

                expect(href.origin).toBe('https://trezor.io');
                expect(href.pathname).toBe('/holiday-deals');

                if (index > 0) {
                    await waitFor(() => {
                        expect(
                            screen.queryByTestId(
                                `@dashboard/promo-banner/${expectedBanners[index - 1]}/button`,
                            ),
                        ).not.toBeInTheDocument();
                    });
                }
            }

            await userEvent.click(screen.getByTestId('@dashboard/promo-banner/close-button'));

            await waitFor(() => {
                expect(
                    screen.queryByTestId(
                        `@dashboard/promo-banner/${expectedBanners.at(-1)}/button`,
                    ),
                ).not.toBeInTheDocument();
            });
            expect(
                screen.getByTestId(`@dashboard/promo-banner/${expectedBanners[0]}/button`),
            ).toBeVisible();
            expect(screen.getAllByRole('button', { name: /Show promo banner/ })).toHaveLength(
                expectedBanners.length - 1,
            );
        },
    );
});
