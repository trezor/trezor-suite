import { type RefObject } from 'react';

import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { TokenMetadataProvider, useTokenMetadataSources } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { BottomSheetModal, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TokenIcon, TokenName, TokenSymbol } from '@suite-native/tokens';

type TokenDetailBottomSheetProps = {
    bottomSheetRef: RefObject<BottomSheetModalMethods | null>;
    networkSymbol: NetworkSymbol;
    tokenContract: TokenAddress;
    issuerDomain: string;
    issuerAddress: string;
    iconContractAddress: TokenAddress | undefined;
    onClose: () => void;
};

export const TokenDetailBottomSheet = ({
    bottomSheetRef,
    networkSymbol,
    tokenContract,
    issuerDomain,
    issuerAddress,
    iconContractAddress,
    onClose,
}: TokenDetailBottomSheetProps) => {
    // The modal renders in a portal outside the screen's metadata provider.
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
                                networkSymbol={networkSymbol}
                                contractAddress={tokenContract}
                                variant="body-md"
                            />
                            <TokenSymbol
                                networkSymbol={networkSymbol}
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
