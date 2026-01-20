import { PromoBannerType } from '../support/pageObjects/dashboardPage';

export function getPromoBannerJsonContent(messageId: string, bannerType: PromoBannerType): string {
    const languages = ['en', 'es', 'cs', 'de', 'fr', 'it', 'pt', 'tr', 'ru', 'ja', 'uk', 'hu'];

    const content = {
        conditions: [
            {
                environment: {
                    desktop: '>=25.10.2',
                    mobile: '!',
                    web: '*',
                },
            },
        ],
        message: {
            id: messageId,
            priority: 2,
            dismissible: true,
            variant: 'info',
            category: 'feature',
            // Dynamically create the language object
            content: Object.fromEntries(languages.map(lang => [lang, 'Placeholder'])),
            feature: [
                {
                    domain: 'dashboard.promoBanner',
                    visibleBanner: bannerType,
                    flag: true,
                },
            ],
        },
    };

    return JSON.stringify(content, null, 2);
}
