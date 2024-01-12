import { Box, Pictogram } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useTranslate } from '@suite-native/intl';

const PLACEHOLDER_HEIGHT = 380;

const titleVariant = prepareNativeStyle(_ => ({
    justifyContent: 'center',
    alignItems: 'center',
    height: PLACEHOLDER_HEIGHT,
}));

export const AccountListPlaceholder = () => {
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(titleVariant)}>
            <Pictogram
                variant="yellow"
                icon="searchLight"
                title={translate('moduleAccounts.emptyState.title')}
                subtitle={translate('moduleAccounts.emptyState.subtitle')}
                titleVariant="titleMedium"
            />
        </Box>
    );
};
