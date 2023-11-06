import { ReactNode } from 'react';

import { BottomSheet, Box, Button, Text, VStack } from '@suite-native/atoms';
import { Video, VideoName } from '@suite-native/video-assets';
import { NetworkType } from '@suite-common/wallet-config';

type XpubHintBottomSheetProps = {
    networkType: NetworkType;
    isVisible: boolean;
    handleClose: () => void;
};

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

export const networkToAssetsMap = {
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

export const defaultAssets = networkToAssetsMap.bitcoin;

export const XpubHintBottomSheet = ({
    networkType,
    isVisible,
    handleClose,
}: XpubHintBottomSheetProps) => {
    const networkAssets = networkToAssetsMap[networkType];
    const { title, text, video } = networkAssets ?? defaultAssets;

    return (
        <BottomSheet title={title} isVisible={isVisible} onClose={handleClose}>
            <Box paddingTop="s" justifyContent="space-between">
                <Video name={video} aspectRatio={1} />
                <VStack spacing="large" paddingTop="large">
                    <Text color="textSubdued" textAlign="center" variant="hint">
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
    );
};
