import { Locator, Page } from '@playwright/test';

import type { DashboardBannerType } from '@trezor/suite/src/views/dashboard/DashboardPromoBanner/dashboardBannerTypes';

export class PromoBanner {
    readonly promoCTAButton = (bannerType: DashboardBannerType): Locator =>
        this.page.getByTestId(`@dashboard/promo-banner/${bannerType}/button`);
    readonly onboardingFeedbackBanner: Locator;
    readonly onboardingFeedbackBannerCTAButton: Locator;
    readonly carouselIndicator = (index: number): Locator =>
        this.page.getByTestId(`@dashboard/promo-banner/carousel-indicator-${index}`);
    readonly carouselSlide = (bannerType: DashboardBannerType): Locator =>
        this.page.getByTestId(`@dashboard/promo-banner/carousel-slide/${bannerType}`);
    readonly closeButton: Locator;

    constructor(private readonly page: Page) {
        this.onboardingFeedbackBanner = this.page.getByTestId('@onboarding/feedback-banner');
        this.onboardingFeedbackBannerCTAButton = this.page.getByTestId(
            '@onboarding/feedback-banner/cta-button',
        );
        this.closeButton = this.page.getByTestId('@dashboard/promo-banner/close-button');
    }
}
