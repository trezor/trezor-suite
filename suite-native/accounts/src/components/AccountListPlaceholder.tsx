import { useRoute } from '@react-navigation/native';

import { Box, Pictogram } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useTranslate } from '@suite-native/intl';
import { ReceiveStackRoutes, RootStackRoutes } from '@suite-native/navigation';
import { IconName } from '@suite-common/icons';

const PLACEHOLDER_HEIGHT = 380;

type AccountListPlaceholderProps = {
    isFilterEmpty?: boolean;
};

const titleVariant = prepareNativeStyle(_ => ({
    justifyContent: 'center',
    alignItems: 'center',
    height: PLACEHOLDER_HEIGHT,
}));

export const AccountListPlaceholder = ({ isFilterEmpty }: AccountListPlaceholderProps) => {
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();
    const route = useRoute();

    const isReceiveRoute =
        route.name === ReceiveStackRoutes.ReceiveAccounts ||
        route.name === RootStackRoutes.ReceiveModal;

    const getIcon = (): IconName => {
        if (!isFilterEmpty) {
            return 'searchLight';
        }

        if (isReceiveRoute) {
            return 'receive';
        }
        return 'discover';
    };

    return (
        <Box style={applyStyle(titleVariant)}>
            <Pictogram
                variant="yellow"
                icon={getIcon()}
                title={translate('moduleAccounts.emptyState.title')}
                subtitle={translate(
                    `moduleAccounts.emptyState.${isFilterEmpty ? 'subtitle' : 'searchAgain'}`,
                )}
                titleVariant="titleMedium"
            />
        </Box>
    );
};
