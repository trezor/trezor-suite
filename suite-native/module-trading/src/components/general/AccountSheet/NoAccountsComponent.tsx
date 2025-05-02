import { useSelector } from 'react-redux';

import {
    selectIsDeviceInViewOnlyMode,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { Text, VStack } from '@suite-native/atoms';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type NoAccountsComponentProps = {
    isBottomRounded: boolean;
};

const contentStyle = prepareNativeStyle<{ isBottomRounded: boolean }>(
    (utils, { isBottomRounded }) => ({
        padding: utils.spacings.sp16,
        flex: 1,
        backgroundColor: utils.colors.backgroundSurfaceElevation1,
        borderTopLeftRadius: utils.borders.radii.r16,
        borderTopRightRadius: utils.borders.radii.r16,
        alignContent: 'center',
        justifyContent: 'center',
        gap: utils.spacings.sp12,
        extend: [
            {
                condition: isBottomRounded,
                style: {
                    borderBottomRightRadius: utils.borders.radii.r16,
                    borderBottomLeftRadius: utils.borders.radii.r16,
                },
            },
        ],
    }),
);

export const NoAccountsComponent = ({ isBottomRounded }: NoAccountsComponentProps) => {
    const { applyStyle } = useNativeStyles();
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

    const getContent = (): { title: TxKeyPath; description: TxKeyPath } => {
        if (isPortfolioTrackerDevice) {
            return {
                title: 'moduleTrading.accountScreen.accountEmpty.portfolioTracker.title',
                description:
                    'moduleTrading.accountScreen.accountEmpty.portfolioTracker.description',
            };
        }

        if (isDeviceInViewOnlyMode) {
            return {
                title: 'moduleTrading.accountScreen.accountEmpty.viewOnly.title',
                description: 'moduleTrading.accountScreen.accountEmpty.viewOnly.description',
            };
        }

        return {
            title: 'moduleTrading.accountScreen.accountEmpty.networkNotEnabled.title',
            description: 'moduleTrading.accountScreen.accountEmpty.networkNotEnabled.description',
        };
    };

    const { title, description } = getContent();

    return (
        <VStack style={applyStyle(contentStyle, { isBottomRounded })}>
            <Text variant="body" color="textDefault" textAlign="center">
                <Translation id={title} />
            </Text>
            <Text variant="hint" color="textSubdued" textAlign="center">
                <Translation id={description} />
            </Text>
        </VStack>
    );
};
