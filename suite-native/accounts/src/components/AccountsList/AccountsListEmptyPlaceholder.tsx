import { useSelector } from 'react-redux';

import { useRoute } from '@react-navigation/native';

import { selectIsDeviceConnected } from '@suite-common/device';
import { Box, PictogramTitleHeader } from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { ReceiveStackRoutes } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

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
        route.name === ReceiveStackRoutes.ReceiveAccount;

    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    const getIcon = (): IconName => {
        if (!isFilterEmpty) {
            return 'magnifyingGlass';
        }
        if (isReceiveRoute) {
            return 'arrowLineDown';
        }

        return 'coins';
    };

    const getSubtitle = (): TxKeyPath => {
        if (!isFilterEmpty) {
            return 'moduleAccounts.emptyState.searchAgain';
        }
        if (isReceiveRoute) {
            return 'moduleAccounts.emptyState.receiveSubtitle';
        }
        if (isDeviceConnected) {
            return 'moduleAccounts.emptyState.addSubtitle';
        }

        return 'moduleAccounts.emptyState.subtitle';
    };

    return (
        <Box style={applyStyle(titleVariant)}>
            <PictogramTitleHeader
                variant="info"
                icon={getIcon()}
                title={<Translation id="moduleAccounts.emptyState.title" />}
                subtitle={<Translation id={getSubtitle()} />}
                titleVariant="headline-md"
            />
        </Box>
    );
};
