import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { Image } from '@trezor/components';

import { Banner } from './Banner';
import { useBannerResponsiveValue } from './useBannerResponsiveValue';

type TradeUpgradeBannerProps = {
    onClose: () => void;
    onCTAClick: () => void;
};

export const TradeUpgradeBanner = ({ onClose, onCTAClick }: TradeUpgradeBannerProps) => {
    const { dispatch } = useServices(injectDispatch);
    const getBannerResponsiveValue = useBannerResponsiveValue();

    const handleCTAClick = () => {
        onCTAClick();
        dispatch(gotoThunk({ routeName: 'wallet-trading-exchange' }));
    };

    return (
        <Banner
            title={<Translation id="TR_PROMO_BANNER_DASHBOARD_TRADE_UPGRADE_TITLE" />}
            description={<Translation id="TR_PROMO_BANNER_DASHBOARD_TRADE_UPGRADE_DESCRIPTION" />}
            ctaLabel={<Translation id="TR_PROMO_BANNER_DASHBOARD_TRADE_UPGRADE_BUTTON" />}
            onCTAClick={handleCTAClick}
            onClose={onClose}
            data-testid="@dashboard/promo-banner/trade-upgrade/button"
            backgroundColor="elementFillAccentVioletSofter"
            imageBackgroundColor="elementFillAccentVioletBold"
            image={
                <Image
                    image="DASHBOARD_PROMO_BANNER_TRADE_UPGRADE"
                    alt=""
                    height="100%"
                    width="100%"
                    objectFit={getBannerResponsiveValue({
                        default: 'cover',
                        laptop: 'contain',
                        tablet: 'contain',
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
