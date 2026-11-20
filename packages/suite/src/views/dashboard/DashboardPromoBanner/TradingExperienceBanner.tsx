import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { Image } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { Banner } from './Banner';
import { useBannerResponsiveValue } from './useBannerResponsiveValue';

type TradingExperienceBannerProps = {
    onClose: () => void;
    onCTAClick: () => void;
};

export const TradingExperienceBanner = ({ onClose, onCTAClick }: TradingExperienceBannerProps) => {
    const { dispatch } = useServices(injectDispatch);
    const getResponsiveValue = useBannerResponsiveValue();

    const handleCTAClick = () => {
        onCTAClick();
        dispatch(gotoThunk({ routeName: 'wallet-trading-exchange' }));
    };

    return (
        <Banner
            title={<Translation id="TR_PROMO_BANNER_DASHBOARD_TRADING_EXPERIENCE_TITLE" />}
            description={
                <Translation id="TR_PROMO_BANNER_DASHBOARD_TRADING_EXPERIENCE_DESCRIPTION" />
            }
            ctaLabel={<Translation id="TR_PROMO_BANNER_DASHBOARD_TRADING_EXPERIENCE_BUTTON" />}
            onCTAClick={handleCTAClick}
            onClose={onClose}
            data-testid="@dashboard/promo-banner/trading-experience/button"
            backgroundColor="elementFillAccentVioletSofter"
            isCloseButtonInverse={getResponsiveValue({ default: true, tablet: false })}
            image={
                <Image
                    image="DASHBOARD_PROMO_BANNER_TRADING_EXPERIENCE"
                    height="100%"
                    width="100%"
                    objectFit="cover"
                    objectPosition="center"
                />
            }
        />
    );
};
