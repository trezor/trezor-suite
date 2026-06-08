import { useSelector } from 'react-redux';

import { useRoute } from '@react-navigation/native';

import { selectIsDeviceConnected } from '@suite-common/device';
import { Box, PictogramTitleHeader, type PictogramTitleHeaderProps } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
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

    const pictogramTitleHeaderProps: Omit<PictogramTitleHeaderProps, 'variant'> = (() => {
        if (!isFilterEmpty) {
            return {
                icon: 'magnifyingGlass',
                title: <Translation id="moduleAccounts.emptyState.searchTitle" />,
            };
        }
        if (isReceiveRoute) {
            return {
                icon: 'arrowLineDown',
                title: <Translation id="moduleAccounts.emptyState.title" />,
                titleVariant: 'headline-md',
                subtitle: <Translation id="moduleAccounts.emptyState.receiveSubtitle" />,
            };
        }

        return {
            icon: 'coins',
            title: <Translation id="moduleAccounts.emptyState.title" />,
            titleVariant: 'headline-md',
            subtitle: (
                <Translation
                    id={
                        isDeviceConnected
                            ? 'moduleAccounts.emptyState.addSubtitle'
                            : 'moduleAccounts.emptyState.subtitle'
                    }
                />
            ),
        };
    })();

    return (
        <Box style={applyStyle(titleVariant)}>
            <PictogramTitleHeader variant="info" {...pictogramTitleHeaderProps} />
        </Box>
    );
};
