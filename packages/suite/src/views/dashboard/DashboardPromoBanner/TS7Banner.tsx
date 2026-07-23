import { useExternalLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { Image } from '@trezor/components';
import { DASHBOARD_BANNER_TS7_URL } from '@trezor/urls';

import { Banner } from './Banner';
import { useBannerResponsiveValue } from './useBannerResponsiveValue';

type TS7BannerProps = {
    onClose: () => void;
    onCTAClick: () => void;
};

export const TS7Banner = ({ onClose, onCTAClick }: TS7BannerProps) => {
    const href = useExternalLink(DASHBOARD_BANNER_TS7_URL);
    const getBannerResponsiveValue = useBannerResponsiveValue();

    return (
        <Banner
            title={<Translation id="TR_PROMO_BANNER_DASHBOARD_TS7_TITLE" />}
            description={<Translation id="TR_PROMO_BANNER_DASHBOARD_TS7_DESCRIPTION" />}
            ctaLabel={<Translation id="TR_PROMO_BANNER_DASHBOARD_TS7_BUTTON" />}
            onCTAClick={onCTAClick}
            onClose={onClose}
            ctaHref={href}
            data-testid="@dashboard/promo-banner/ts7/button"
            imageBackgroundColor="elementFillBrandSofter"
            image={
                <Image
                    image="DASHBOARD_PROMO_BANNER_T3W1"
                    height="100%"
                    width="100%"
                    objectFit={getBannerResponsiveValue({
                        default: 'cover',
                        laptop: 'contain',
                    })}
                    objectPosition={getBannerResponsiveValue({
                        default: 'top',
                        laptop: 'center',
                    })}
                />
            }
        />
    );
};
