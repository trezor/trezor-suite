import { useRoute } from '@react-navigation/native';

import { Box, PictogramTitleHeader } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TxKeyPath, Translation } from '@suite-native/intl';
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
