import React, { ReactNode, useState } from 'react';
import { TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';

import { Network } from '@suite-common/wallet-config';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { BottomSheet, Box, Button, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';
import { Video, VideoName } from '@suite-native/video-assets';

type NetworkType = Network['networkType'];

type XpubScanHintSheet = {
    networkType: NetworkType;
};

const sheetTriggerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: utils.spacings.large,
    backgroundColor: utils.colors.gray100,
}));

const EmphasizedText = ({ children }: { children: ReactNode }) => (
    <Text color="gray900" variant="hint">
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
                To view the Bitcoin XPUB of your account, open the Trezor Suite desktop app, plug in
                your Trezor device, select <EmphasizedText>Accounts</EmphasizedText>, then choose{' '}
                <EmphasizedText>Show public key</EmphasizedText>.
            </>
        ),
        video: 'xpubImportBTC',
    },
    ethereum: {
        title: 'Where is my receive address?',
        text: (
            <>
                To view the Ethereum and Ethereum Classic receive address of your account, open the
                Trezor Suite desktop app, plug in your Trezor device, select{' '}
                <EmphasizedText>Accounts</EmphasizedText>, choose Receive, and click on{' '}
                <EmphasizedText>Show full address</EmphasizedText>.
            </>
        ),
        video: 'xpubImportETH',
    },
    ripple: {
        title: 'Where is my receive address?',
        text: (
            <>
                To view the Ripple receive address of your account, open the Trezor Suite desktop
                app, plug in your Trezor device, select <EmphasizedText>Accounts</EmphasizedText>,
                choose
                <EmphasizedText>Receive</EmphasizedText>, and click on{' '}
                <EmphasizedText>Show full address</EmphasizedText>
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
                        <Icon name="question" size="medium" color="forest" />
                    </Box>
                    <Text color="forest">{title}</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>

            <BottomSheet title={title} isVisible={isVisible} onClose={handleClose}>
                <Box paddingTop="small" justifyContent="space-between">
                    <Video name={video} aspectRatio={1} />
                    <VStack spacing="large" paddingTop="large">
                        <Text color="gray600" align="center" variant="hint">
                            {text}
                        </Text>
                    </VStack>
                    <Box marginTop="extraLarge">
                        <Button onPress={handleClose}>Got it</Button>
                    </Box>
                </Box>
            </BottomSheet>
        </>
    );
};
