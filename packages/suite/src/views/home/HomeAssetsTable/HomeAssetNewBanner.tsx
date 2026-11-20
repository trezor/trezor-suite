import { Translation } from '@suite/intl';
import {
    closeHomeAssetTableNewBanner,
    selectIsHomeAssetTableNewBannerClosed,
} from '@suite-common/wallet-core';
import { Banner, Divider } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { LightningIcon, XIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from '#src/hooks/suite/useSelector';

export const HomeAssetNewBanner = () => {
    const isClosed = useSelector(selectIsHomeAssetTableNewBannerClosed);
    const { dispatch } = useServices(injectDispatch);

    if (isClosed) {
        return null;
    }

    return (
        <>
            <Banner
                intent="brand"
                isInline
                icon={LightningIcon}
                data-testid="@dashboard/home-asset/banner"
                title={
                    <span data-testid="@dashboard/home-asset/banner/title">
                        <Translation id="TR_HOME_ASSET_BANNER_TITLE" />
                    </span>
                }
                description={
                    <span data-testid="@dashboard/home-asset/banner/description">
                        <Translation id="TR_HOME_ASSET_BANNER_TEXT" />
                    </span>
                }
                rightContent={
                    <Banner.IconButton
                        icon={XIcon}
                        priority="secondary"
                        onClick={() => dispatch(closeHomeAssetTableNewBanner())}
                        tooltip={{ content: <Translation id="TR_DISMISS" /> }}
                        data-testid="@dashboard/home-asset/banner/dismiss"
                    />
                }
            />
            <Divider margin={{ top: -1 }} color="elementBorderBrandSofter" />
        </>
    );
};
