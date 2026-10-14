import { selectIsHomeAssetTableNewBannerClosed, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { Box, Column, IconButton, IconCircle, Row, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { LightningIcon, XIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';

// Temporary: it only announces the table while the asset-first experiment runs, and goes with it.
// Its own banner rather than the shared one: that is edged and inset, this sits flush on the card
// the table is drawn on, taking the card's own corners.
export const HomeAssetNewBanner = () => {
    const isClosed = useSelector(selectIsHomeAssetTableNewBannerClosed);
    const { dispatch } = useServices(injectDispatch);

    if (isClosed) {
        return null;
    }

    return (
        <Box
            backgroundColor="elementFillBrandSofter"
            padding={{ vertical: 16, horizontal: 20 }}
            data-testid="@dashboard/home-asset/banner"
        >
            <Row gap={12} alignItems="center">
                <IconCircle icon={LightningIcon} size={32} intent="brand" />

                <Column gap={2} alignItems="flex-start" flex="1">
                    <Text typographyStyle="body-md-strong">
                        <Translation id="TR_HOME_ASSET_BANNER_TITLE" />
                    </Text>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_HOME_ASSET_BANNER_TEXT" />
                    </Text>
                </Column>

                <IconButton
                    icon={XIcon}
                    intent="neutral"
                    priority="secondary"
                    size="small"
                    onClick={() =>
                        dispatch(setFlag({ key: 'homeAssetTableNewBannerClosed', value: true }))
                    }
                    tooltip={{ content: <Translation id="TR_DISMISS" /> }}
                    data-testid="@dashboard/home-asset/banner/dismiss"
                />
            </Row>
        </Box>
    );
};
