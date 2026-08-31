import { useDispatch } from 'react-redux';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { Box, Image } from '@trezor/components';

import { Banner } from './Banner';

type ETHVaultBannerProps = {
    onClose: () => void;
    onCTAClick: () => void;
};

export const ETHVaultBanner = ({ onClose, onCTAClick }: ETHVaultBannerProps) => {
    const dispatch = useDispatch();

    const handleCTAClick = () => {
        onCTAClick();
        dispatch(goto({ routeName: 'suite-earn' }));
    };

    return (
        <Banner
            title={<Translation id="TR_PROMO_BANNER_DASHBOARD_ETH_VAULT_TITLE" />}
            description={<Translation id="TR_PROMO_BANNER_DASHBOARD_ETH_VAULT_DESCRIPTION" />}
            ctaLabel={<Translation id="TR_PROMO_BANNER_DASHBOARD_ETH_VAULT_BUTTON" />}
            onCTAClick={handleCTAClick}
            onClose={onClose}
            data-testid="@dashboard/promo-banner/eth-vault/button"
            backgroundColor="elementFillAccentVioletSofter"
            imageBackgroundColor="transparent"
            image={
                <Box height="100%" backgroundColor="elementFillAccentVioletBold">
                    <Image
                        image="DASHBOARD_PROMO_BANNER_ETH_VAULT"
                        height="100%"
                        width="100%"
                        objectFit="cover"
                        objectPosition="center"
                    />
                </Box>
            }
        />
    );
};
