import { useExternalLink } from '@suite/external-links';
import { Translation, type TranslationKey } from '@suite/intl';
import { Image, type ImageKey } from '@trezor/components';
import { DASHBOARD_BANNER_HOLIDAY_DEALS_URL, withHolidayDealsUtm } from '@trezor/urls';

import { Banner } from './Banner';
import { type BlackFridayHolidayBannerType } from './dashboardBannerTypes';
import { useBannerResponsiveValue } from './useBannerResponsiveValue';

type BlackFridayHolidayBannerContent = {
    title: TranslationKey;
    description: TranslationKey;
    image: ImageKey;
};

const banners: Record<BlackFridayHolidayBannerType, BlackFridayHolidayBannerContent> = {
    'bfh26-ts7-accessory-pack': {
        title: 'TR_PROMO_BANNER_DASHBOARD_BFH26_TS7_ACCESSORY_PACK_TITLE',
        description: 'TR_PROMO_BANNER_DASHBOARD_BFH26_TS7_ACCESSORY_PACK_DESCRIPTION',
        image: 'DASHBOARD_PROMO_BANNER_BFH26_TS7_ACCESSORY_PACK',
    },
    'bfh26-keep-metal': {
        title: 'TR_PROMO_BANNER_DASHBOARD_BFH26_KEEP_METAL_TITLE',
        description: 'TR_PROMO_BANNER_DASHBOARD_BFH26_KEEP_METAL_DESCRIPTION',
        image: 'DASHBOARD_PROMO_BANNER_BFH26_KEEP_METAL',
    },
    'bfh26-ts3-gift': {
        title: 'TR_PROMO_BANNER_DASHBOARD_BFH26_TS3_GIFT_TITLE',
        description: 'TR_PROMO_BANNER_DASHBOARD_BFH26_TS3_GIFT_DESCRIPTION',
        image: 'DASHBOARD_PROMO_BANNER_BFH26_TS3_GIFT',
    },
    'bfh26-ts3-backup': {
        title: 'TR_PROMO_BANNER_DASHBOARD_BFH26_TS3_BACKUP_TITLE',
        description: 'TR_PROMO_BANNER_DASHBOARD_BFH26_TS3_BACKUP_DESCRIPTION',
        image: 'DASHBOARD_PROMO_BANNER_BFH26_TS3_BACKUP',
    },
    'bfh26-ts7-complete-kit': {
        title: 'TR_PROMO_BANNER_DASHBOARD_BFH26_TS7_COMPLETE_KIT_TITLE',
        description: 'TR_PROMO_BANNER_DASHBOARD_BFH26_TS7_COMPLETE_KIT_DESCRIPTION',
        image: 'DASHBOARD_PROMO_BANNER_BFH26_TS7_COMPLETE_KIT',
    },
    'bfh26-egift-card': {
        title: 'TR_PROMO_BANNER_DASHBOARD_BFH26_EGIFT_CARD_TITLE',
        description: 'TR_PROMO_BANNER_DASHBOARD_BFH26_EGIFT_CARD_DESCRIPTION',
        image: 'DASHBOARD_PROMO_BANNER_BFH26_EGIFT_CARD',
    },
    'bfh26-ts7-upgrade': {
        title: 'TR_PROMO_BANNER_DASHBOARD_BFH26_TS7_UPGRADE_TITLE',
        description: 'TR_PROMO_BANNER_DASHBOARD_BFH26_TS7_UPGRADE_DESCRIPTION',
        image: 'DASHBOARD_PROMO_BANNER_BFH26_TS7_UPGRADE',
    },
};

type BlackFridayHolidayBannerProps = {
    bannerType: BlackFridayHolidayBannerType;
    onClose: () => void;
    onCTAClick: () => void;
};

export const BlackFridayHolidayBanner = ({
    bannerType,
    onClose,
    onCTAClick,
}: BlackFridayHolidayBannerProps) => {
    const banner = banners[bannerType];
    const href = useExternalLink(
        withHolidayDealsUtm(DASHBOARD_BANNER_HOLIDAY_DEALS_URL, bannerType),
    );
    const getResponsiveValue = useBannerResponsiveValue();

    return (
        <Banner
            title={<Translation id={banner.title} />}
            description={<Translation id={banner.description} />}
            ctaLabel={<Translation id="TR_BUY" />}
            ctaHref={href}
            onCTAClick={onCTAClick}
            onClose={onClose}
            isCloseButtonInverse={getResponsiveValue({ default: true, tablet: false })}
            data-testid={`@dashboard/promo-banner/${bannerType}/button`}
            image={
                <Image
                    image={banner.image}
                    alt=""
                    height="100%"
                    width="100%"
                    objectFit="cover"
                    objectPosition="center"
                />
            }
        />
    );
};
