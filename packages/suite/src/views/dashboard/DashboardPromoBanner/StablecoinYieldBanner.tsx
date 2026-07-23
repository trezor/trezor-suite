import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { Image } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';

import { Banner } from './Banner';
import { useBannerResponsiveValue } from './useBannerResponsiveValue';

type StablecoinYieldBannerProps = {
    onClose: () => void;
    onCTAClick: () => void;
};

export const StablecoinYieldBanner = ({ onClose, onCTAClick }: StablecoinYieldBannerProps) => {
    const dispatch = useDispatch();
    const getBannerResponsiveValue = useBannerResponsiveValue();

    const handleCTAClick = () => {
        onCTAClick();
        dispatch(goto({ routeName: 'suite-earn' }));
    };

    return (
        <Banner
            title={<Translation id="TR_PROMO_BANNER_DASHBOARD_STABLECOIN_YIELD_TITLE" />}
            description={
                <Translation id="TR_PROMO_BANNER_DASHBOARD_STABLECOIN_YIELD_DESCRIPTION" />
            }
            ctaLabel={<Translation id="TR_PROMO_BANNER_DASHBOARD_STABLECOIN_YIELD_BUTTON" />}
            onCTAClick={handleCTAClick}
            onClose={onClose}
            data-testid="@dashboard/promo-banner/stablecoin-yield/button"
            image={
                <Image
                    image="DASHBOARD_PROMO_BANNER_STABLECOIN_YIELD"
                    height="100%"
                    width="100%"
                    objectFit={getBannerResponsiveValue({
                        default: 'cover',
                        laptop: 'contain',
                    })}
                    objectPosition={getBannerResponsiveValue({
                        default: 'center',
                        tablet: 'top',
                    })}
                />
            }
        />
    );
};
