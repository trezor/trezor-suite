import { Locator, Page } from '@playwright/test';

import type { DashboardBannerType } from '@trezor/suite';

export class PromoBanner {
    readonly promoCTAButton = (bannerType: DashboardBannerType): Locator =>
        this.page.getByTestId(`@dashboard/promo-banner/${bannerType}/button`);
    readonly onboardingFeedbackBanner: Locator;
    readonly onboardingFeedbackBannerCTAButton: Locator;
    readonly carouselIndicator = (index: number): Locator =>
        this.page.getByTestId(`@dashboard/promo-banner/carousel-indicator-${index}`);
    readonly carouselSlide = (bannerType: DashboardBannerType): Locator =>
        this.page.getByTestId(`@dashboard/promo-banner/carousel-slide/${bannerType}`);
    readonly closeButton = (bannerType: DashboardBannerType): Locator =>
        this.carouselSlide(bannerType).getByTestId('@dashboard/promo-banner/close-button');

    constructor(private readonly page: Page) {
        this.onboardingFeedbackBanner = this.page.getByTestId(
            '@dashboard/onboarding-feedback-banner',
        );
        this.onboardingFeedbackBannerCTAButton = this.page.getByTestId(
            '@dashboard/onboarding-feedback-banner/button',
        );
    }
}
