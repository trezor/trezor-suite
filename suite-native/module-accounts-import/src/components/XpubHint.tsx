import React, { ReactNode, useState } from 'react';
import { TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';

import { NetworkType } from '@suite-common/wallet-config';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { BottomSheet, Box, Button, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-common/icons';
import { Video, VideoName } from '@suite-native/video-assets';

type XpubScanHintSheet = {
    networkType: NetworkType;
};

const sheetTriggerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: utils.spacings.large,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    borderTopWidth: utils.borders.widths.small,
    borderTopColor: utils.colors.borderOnElevation0,
}));

const EmphasizedText = ({ children }: { children: ReactNode }) => (
    <Text color="textDefault" variant="hint">
        {children}
    </Text>
);

type NetworkAssets = {
    title: string;
    text: ReactNode;
    video: VideoName;
};

const networkToAssetsMap = {
    bitcoin: {
        title: 'Where is my public key (XPUB)?',
        text: (
            <>
                To view the public key (XPUB) of your account, open the Trezor Suite app, plug in
                your Trezor device, then select <EmphasizedText>Details</EmphasizedText>, then
                choose <EmphasizedText>Show public key.</EmphasizedText>
            </>
        ),
        video: 'xpubImportBTC',
    },
    ethereum: {
        title: 'Where is my receive address?',
        text: (
            <>
                To view the receive address of your account, open the Trezor Suite desktop app, plug
                in your Trezor device, select <EmphasizedText>Accounts</EmphasizedText>, choose{' '}
                <EmphasizedText>Receive</EmphasizedText>, and click on{' '}
                <EmphasizedText>Show full address</EmphasizedText>.
            </>
        ),
        video: 'xpubImportETH',
    },
    ripple: {
        title: 'Where is my receive address?',
        text: (
            <>
                To view the receive address of your account, open the Trezor Suite desktop app, plug
                in your Trezor device, select <EmphasizedText>Accounts</EmphasizedText>, choose{' '}
                <EmphasizedText>Receive</EmphasizedText>, and click on{' '}
                <EmphasizedText>Show full address</EmphasizedText>.
            </>
        ),
        video: 'xpubImportETH',
    },
    cardano: undefined,
} as const satisfies Record<NetworkType, NetworkAssets | undefined>;

const defaultAssets = networkToAssetsMap.bitcoin;

export const XpubHint = ({ networkType }: XpubScanHintSheet) => {
    const [isVisible, setIsVisible] = useState(false);
    const { applyStyle } = useNativeStyles();

    const networkAssets = networkToAssetsMap[networkType];
    const { title, text, video } = networkAssets ?? defaultAssets;

    const handleOpen = () => setIsVisible(true);
    const handleClose = () => setIsVisible(false);

    return (
        <>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                {/*  TODO : Replace with a TextButton atom component when ready. */}
                <TouchableOpacity onPress={handleOpen} style={applyStyle(sheetTriggerStyle)}>
                    <Box marginRight="small">
                        <Icon name="question" size="medium" color="iconPrimaryDefault" />
                    </Box>
                    <Text
                        data-testID="@accounts-import/sync-coins/xpub-help-link"
                        color="textPrimaryDefault"
                    >
                        {title}
                    </Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>

            <BottomSheet title={title} isVisible={isVisible} onClose={handleClose}>
                <Box paddingTop="small" justifyContent="space-between">
                    <Video name={video} aspectRatio={1} />
                    <VStack spacing="large" paddingTop="large">
                        <Text color="textSubdued" align="center" variant="hint">
                            {text}
                        </Text>
                    </VStack>
                    <Box marginTop="extraLarge">
                        <Button
                            data-testID="@accounts-import/xpub-help-modal/confirm-btn"
                            onPress={handleClose}
                        >
                            Got it
                        </Button>
                    </Box>
                </Box>
            </BottomSheet>
        </>
    );
};
