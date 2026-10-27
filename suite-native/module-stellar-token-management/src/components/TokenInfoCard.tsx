import { Pressable } from 'react-native';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon, TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TokenName } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type TokenInfoCardProps = {
    tokenName: string;
    issuerDomain: string;
    iconContractAddress: TokenAddress | undefined;
    onPress: () => void;
};

const tokenCardStyle = prepareNativeStyle(utils => ({
    borderWidth: 1,
    borderColor: utils.colors.borderNeutral,
    borderRadius: utils.borders.radii.r12,
}));

export const TokenInfoCard = ({
    tokenName,
    issuerDomain,
    iconContractAddress,
    onPress,
}: TokenInfoCardProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable onPress={onPress}>
            <Card noPadding style={applyStyle(tokenCardStyle)}>
                <HStack justifyContent="space-between" alignItems="center" padding="sp16">
                    <VStack spacing="sp8">
                        <Text variant="body-md-strong">
                            <Translation id="moduleStellarToken.networkFee.token" />
                        </Text>
                        <Text variant="body-md-strong">
                            <Translation id="moduleStellarToken.tokenDetail.issuer" />
                        </Text>
                    </VStack>
                    <HStack alignItems="center" spacing="sp12">
                        <VStack spacing="sp8" alignItems="flex-end">
                            <HStack alignItems="center" spacing="sp8">
                                <TokenIcon
                                    networkSymbol={asNetworkSymbol('xlm')}
                                    contractAddress={iconContractAddress}
                                    tokenSymbol={tokenName}
                                    size="extraSmall"
                                />
                                <TokenName
                                    text={tokenName}
                                    networkSymbol={asNetworkSymbol('xlm')}
                                    tokenContract={iconContractAddress}
                                />
                            </HStack>
                            <Text variant="body-md">{issuerDomain}</Text>
                        </VStack>
                        <Icon name="caretDown" color="contentSecondary" />
                    </HStack>
                </HStack>
            </Card>
        </Pressable>
    );
};
