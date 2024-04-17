import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';

import { A } from '@mobily/ts-belt';

import { Screen, ScreenSubHeader } from '@suite-native/navigation';
import { Box, Button, Card, HStack, IconButton, Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { selectPhysicalDevices, toggleRememberDevice } from '@suite-common/wallet-core';
import { TrezorDevice } from '@suite-common/suite-types';
import { Link } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AboutViewOnlyBottomSheet } from '../components/AboutViewOnlyBottomSheet';
import { SecuredCoinsSvg } from '../assets/SecuredCoinsSvg';

type AboutProps = {
    onPressAbout: () => void;
};

const About = ({ onPressAbout }: AboutProps) => (
    <Box marginVertical="medium" marginHorizontal="extraLarge" alignItems="center">
        <Text variant="hint" textAlign="center" color="textSubdued">
            <Translation
                id="moduleSettings.viewOnly.subtitle"
                values={{
                    about: chunk =>
                        chunk && (
                            <Link
                                label={chunk}
                                onPress={onPressAbout}
                                isUnderlined
                                textColor="textSubdued"
                                textPressedColor="textSubdued"
                            />
                        ),
                }}
            />
        </Text>
    </Box>
);

const svgWrapperStyle = prepareNativeStyle(utils => ({
    width: 180,
    height: 156,
    paddingBottom: utils.spacings.large,
}));

const emptyContentStyle = prepareNativeStyle(utils => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: utils.spacings.large,
}));

const EmptyContent = ({ onPressAbout }: AboutProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(emptyContentStyle)}>
            <Box style={applyStyle(svgWrapperStyle)}>
                <SecuredCoinsSvg />
            </Box>
            <Text variant="titleSmall" textAlign="center">
                <Translation id="moduleSettings.viewOnly.emptyTitle" />
            </Text>
            <About onPressAbout={onPressAbout} />
        </Box>
    );
};

const DevicesContent = ({ onPressAbout }: AboutProps) => {
    const dispatch = useDispatch();
    const devices = useSelector(selectPhysicalDevices);

    const handleViewOnlyChange = (device: TrezorDevice) => {
        dispatch(toggleRememberDevice({ device }));
    };

    return (
        <>
            <Box paddingHorizontal="large">
                <About onPressAbout={onPressAbout} />
            </Box>
            {devices.map(device => (
                <Card key={device.id}>
                    <HStack justifyContent="space-between" alignItems="center">
                        <Text>{device?.label}</Text>
                        {device.remember ? (
                            <IconButton
                                colorScheme="redElevation0"
                                iconName="close"
                                onPress={() => handleViewOnlyChange(device)}
                            />
                        ) : (
                            <Button onPress={() => handleViewOnlyChange(device)}>
                                <Translation id="moduleSettings.viewOnly.enableButton" />
                            </Button>
                        )}
                    </HStack>
                </Card>
            ))}
        </>
    );
};

export const SettingsViewOnly = () => {
    const { translate } = useTranslate();
    const [isVisibleAboutViewOnly, setIsVisibleAboutViewOnly] = useState(false);

    const devices = useSelector(selectPhysicalDevices);

    const showAboutViewOnly = () => setIsVisibleAboutViewOnly(true);

    return (
        <Screen
            screenHeader={<ScreenSubHeader content={translate('moduleSettings.viewOnly.title')} />}
        >
            {A.isEmpty(devices) ? (
                <EmptyContent onPressAbout={showAboutViewOnly} />
            ) : (
                <DevicesContent onPressAbout={showAboutViewOnly} />
            )}
            <AboutViewOnlyBottomSheet
                isVisible={isVisibleAboutViewOnly}
                onClose={() => setIsVisibleAboutViewOnly(false)}
            />
        </Screen>
    );
};
