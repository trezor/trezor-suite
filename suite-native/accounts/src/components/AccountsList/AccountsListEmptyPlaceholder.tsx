import { useRoute } from '@react-navigation/native';

import { Box, PictogramTitleHeader } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TxKeyPath, Translation } from '@suite-native/intl';
import { ReceiveStackRoutes, RootStackRoutes } from '@suite-native/navigation';
import { IconName } from '@suite-native/icons';

const PLACEHOLDER_HEIGHT = 380;

type AccountsListEmptyPlaceholderProps = {
    isFilterEmpty?: boolean;
};

const titleVariant = prepareNativeStyle(_ => ({
    justifyContent: 'center',
    alignItems: 'center',
    height: PLACEHOLDER_HEIGHT,
}));

export const AccountsListEmptyPlaceholder = ({
    isFilterEmpty,
}: AccountsListEmptyPlaceholderProps) => {
    const { applyStyle } = useNativeStyles();
    const route = useRoute();

    const isReceiveRoute =
        route.name === ReceiveStackRoutes.ReceiveAccounts ||
        route.name === RootStackRoutes.ReceiveModal;

    const getIcon = (): IconName => {
        if (!isFilterEmpty) {
            return 'magnifyingGlass';
        }

        if (isReceiveRoute) {
            return 'arrowLineDown';
        }

        return 'discover';
    };

    const getSubtitle = (): TxKeyPath => {
        if (!isFilterEmpty) {
            return 'moduleAccounts.emptyState.searchAgain';
        }

        if (isReceiveRoute) {
            return 'moduleAccounts.emptyState.receiveSubtitle';
        }

        return 'moduleAccounts.emptyState.subtitle';
    };

    return (
        <Box style={applyStyle(titleVariant)}>
            <PictogramTitleHeader
                variant="yellow"
                icon={getIcon()}
                title={<Translation id="moduleAccounts.emptyState.title" />}
                subtitle={<Translation id={getSubtitle()} />}
                titleVariant="titleMedium"
            />
        </Box>
    );
};
