import { Box, Button, Divider, TextDivider } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const footerStyle = prepareNativeStyle(utils => ({
    paddingTop: utils.spacings.sp8,
    paddingBottom: utils.spacings.sp16,
    flex: 1,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderBottomLeftRadius: utils.borders.radii.r16,
    borderBottomRightRadius: utils.borders.radii.r16,
}));

export type AccountsListFooterProps = {
    hasTextualDivider: boolean;
    onAddAccountTap: () => void;
};

export const AccountListFooter = ({
    hasTextualDivider,
    onAddAccountTap,
}: AccountsListFooterProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(footerStyle)}>
            {hasTextualDivider ? (
                <TextDivider title="generic.orSeparator" />
            ) : (
                <Divider marginBottom="sp16" />
            )}
            <Box paddingTop="sp8" paddingHorizontal="sp16">
                <Button
                    intent="neutral"
                    priority="secondary"
                    onPress={onAddAccountTap}
                    testID="@add-account/after-discovery/button-add-new"
                >
                    <Translation id="moduleAddAccounts.coinDiscoveryFinishedScreen.addButton" />
                </Button>
            </Box>
        </Box>
    );
};
