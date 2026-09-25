import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { Box, Column, GhostContainer, Icon, Row, Text } from '@trezor/components';
import { LightningIcon, XIcon } from '@trezor/icons';

import { dismissNewAssetTableBannerThunk } from 'src/actions/suite/assetTableThunks';
import { useSelector } from 'src/hooks/suite';
import { selectIsNewAssetTableBannerDismissed } from 'src/reducers/suite/assetTableReducer';

export const AssetFirstNewBanner = () => {
    const isDismissed = useSelector(selectIsNewAssetTableBannerDismissed);
    const { dispatch } = useServices(injectDispatch);

    if (isDismissed) {
        return null;
    }

    return (
        // The banner sits on the table's card, which clips its own corners, so this needs none of
        // its own.
        <Box
            backgroundColor="elementFillBrandSofter"
            padding={{ vertical: 16, horizontal: 20 }}
            data-testid="@dashboard/asset-first/banner"
        >
            <Row gap={12} alignItems="center">
                <Box
                    backgroundColor="elementFillBrandSofter"
                    borderRadius="full"
                    width={32}
                    height={32}
                >
                    <Row height="100%" justifyContent="center" alignItems="center">
                        <Icon as={LightningIcon} size={16} intent="brand" />
                    </Row>
                </Box>

                <Column gap={2} alignItems="flex-start" flex="1">
                    <Text typographyStyle="body-md-strong">
                        <Translation id="TR_ASSET_FIRST_BANNER_TITLE" />
                    </Text>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_ASSET_FIRST_BANNER_TEXT" />
                    </Text>
                </Column>

                <GhostContainer
                    padding={4}
                    borderRadius={6}
                    onClick={() => dispatch(dismissNewAssetTableBannerThunk())}
                    data-testid="@dashboard/asset-first/banner/dismiss"
                >
                    <Icon as={XIcon} size={16} intent="neutral" priority="secondary" />
                </GhostContainer>
            </Row>
        </Box>
    );
};
