import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { Image } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';

import { Banner } from './Banner';
import { useBannerResponsiveValue } from './useBannerResponsiveValue';

type DefiYieldBannerProps = {
    onClose: () => void;
    onCTAClick: () => void;
};

export const DefiYieldBanner = ({ onClose, onCTAClick }: DefiYieldBannerProps) => {
    const dispatch = useDispatch();
    const getBannerResponsiveValue = useBannerResponsiveValue();

    const handleCTAClick = () => {
        onCTAClick();
        dispatch(goto({ routeName: 'suite-earn' }));
    };

    return (
        <Banner
            title={<Translation id="TR_PROMO_BANNER_DASHBOARD_DEFI_YIELD_TITLE" />}
            description={<Translation id="TR_PROMO_BANNER_DASHBOARD_DEFI_YIELD_DESCRIPTION" />}
            ctaLabel={<Translation id="TR_PROMO_BANNER_DASHBOARD_DEFI_YIELD_BUTTON" />}
            onCTAClick={handleCTAClick}
            onClose={onClose}
            data-testid="@dashboard/promo-banner/defi-yield/button"
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
