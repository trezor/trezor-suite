import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { Image } from '@trezor/components';

import { Banner } from './Banner';

type TradingExperienceBannerProps = {
    onClose: () => void;
    onCTAClick: () => void;
};

export const TradingExperienceBanner = ({ onClose, onCTAClick }: TradingExperienceBannerProps) => {
    const { dispatch } = useServices(injectDispatch);

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
