import { type RefObject } from 'react';

import { type BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';

import { type TokenAddress } from '@suite-common/wallet-types';
import { BottomSheetModal, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

type TokenDetailBottomSheetProps = {
    bottomSheetRef: RefObject<GorhomBottomSheetModal | null>;
    tokenName: string;
    assetCode: string;
    issuerDomain: string;
    issuerAddress: string;
    iconContractAddress: TokenAddress | undefined;
    onClose: () => void;
};

export const TokenDetailBottomSheet = ({
    bottomSheetRef,
    tokenName,
    assetCode,
    issuerDomain,
    issuerAddress,
    iconContractAddress,
    onClose,
}: TokenDetailBottomSheetProps) => (
    <BottomSheetModal ref={bottomSheetRef} onDismiss={onClose}>
        <VStack spacing="sp16" paddingHorizontal="sp16">
            <HStack alignItems="center" spacing="sp12">
                <CryptoIcon symbol="xlm" contractAddress={iconContractAddress} size="large" />
                <VStack>
                    <Text variant="body-md">{tokenName}</Text>
                    <Text variant="body-sm" color="contentSecondary">
                        {assetCode}
                    </Text>
                </VStack>
            </HStack>

            <VStack spacing="sp12">
                <VStack spacing="sp4">
                    <Text variant="body-md-strong">
                        <Translation id="moduleStellarToken.tokenDetail.issuer" />
                    </Text>
                    <Text variant="body-md">{issuerDomain}</Text>
                </VStack>

                <VStack spacing="sp4">
                    <Text variant="body-md-strong">
                        <Translation id="moduleStellarToken.tokenDetail.issuerAddress" />
                    </Text>
                    <Text variant="body-md">{issuerAddress}</Text>
                </VStack>
            </VStack>

            <Button intent="brand" priority="primary" onPress={onClose}>
                <Translation id="generic.buttons.goBack" />
            </Button>
        </VStack>
    </BottomSheetModal>
);
