import { type RefObject } from 'react';

import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { type TokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { BottomSheetModal, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    TokenIcon,
    TokenMetadataProvider,
    TokenName,
    TokenSymbol,
    useTokenMetadataSources,
} from '@suite-native/tokens';

type TokenDetailBottomSheetProps = {
    bottomSheetRef: RefObject<BottomSheetModalMethods | null>;
    issuerDomain: string;
    issuerAddress: string;
    iconContractAddress: TokenAddress | undefined;
    tokenContract: TokenAddress;
    onClose: () => void;
};

export const TokenDetailBottomSheet = ({
    bottomSheetRef,
    issuerDomain,
    issuerAddress,
    iconContractAddress,
    tokenContract,
    onClose,
}: TokenDetailBottomSheetProps) => {
    const sources = useTokenMetadataSources();

    return (
        <BottomSheetModal ref={bottomSheetRef} onDismiss={onClose}>
            <TokenMetadataProvider sources={sources}>
                <VStack spacing="sp16" paddingHorizontal="sp16">
                    <HStack alignItems="center" spacing="sp12">
                        <TokenIcon
                            networkSymbol={asNetworkSymbol('xlm')}
                            contractAddress={iconContractAddress}
                            size="large"
                        />
                        <VStack>
                            <TokenName
                                networkSymbol={asNetworkSymbol('xlm')}
                                contractAddress={tokenContract}
                            />
                            <TokenSymbol
                                networkSymbol={asNetworkSymbol('xlm')}
                                contractAddress={tokenContract}
                                variant="body-sm"
                                color="contentSecondary"
                            />
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
            </TokenMetadataProvider>
        </BottomSheetModal>
    );
};
