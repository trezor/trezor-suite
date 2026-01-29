import { RefObject } from 'react';

import { BottomSheetModal as GorhomBottomSheetModal } from '@gorhom/bottom-sheet';

import { TokenAddress } from '@suite-common/wallet-types';
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
                    <Text variant="body">{tokenName}</Text>
                    <Text variant="hint" color="textSubdued">
                        {assetCode}
                    </Text>
                </VStack>
            </HStack>

            <VStack spacing="sp12">
                <VStack spacing="sp4">
                    <Text variant="highlight">
                        <Translation id="moduleStellarToken.tokenDetail.issuer" />
                    </Text>
                    <Text variant="body">{issuerDomain}</Text>
                </VStack>

                <VStack spacing="sp4">
                    <Text variant="highlight">
                        <Translation id="moduleStellarToken.tokenDetail.issuerAddress" />
                    </Text>
                    <Text variant="body">{issuerAddress}</Text>
                </VStack>
            </VStack>

            <Button colorScheme="primary" onPress={onClose}>
                <Translation id="generic.buttons.goBack" />
            </Button>
        </VStack>
    </BottomSheetModal>
);
