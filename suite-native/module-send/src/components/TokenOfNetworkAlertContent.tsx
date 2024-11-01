import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { getNetwork } from '@suite-common/wallet-config';
import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { VStack, Box, AlertBox, Text } from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TokensRootState, selectAccountTokenSymbol } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const iconWrapperStyle = prepareNativeStyle(() => ({
    overflow: 'visible',
    height: 90,
    width: 90,
}));

const networkIconWrapperStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    right: 0,
    bottom: 0,
    padding: 3,
    overflow: 'visible',
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.round,
}));

type ParagraphProps = {
    header: ReactNode;
    body: ReactNode;
};

const Paragraph = ({ header, body }: ParagraphProps) => (
    <VStack spacing="sp4">
        <Text variant="highlight">{header}</Text>
        <Text color="textSubdued">{body}</Text>
    </VStack>
);

export const TokenOfNetworkAlertBody = ({
    accountKey,
    tokenContract,
}: {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
}) => {
    const { applyStyle } = useNativeStyles();
    const tokenSymbol = useSelector((state: TokensRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenContract),
    );
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    if (!tokenContract || !networkSymbol) return null;

    const networkName = getNetwork(networkSymbol).name;

    return (
        <VStack spacing="sp24">
            <Box style={applyStyle(iconWrapperStyle)}>
                <CryptoIcon symbol={networkSymbol} contractAddress={tokenContract} size={80} />
                <Box style={applyStyle(networkIconWrapperStyle)}>
                    <CryptoIcon symbol={networkSymbol} size={32} />
                </Box>
            </Box>
            <Text variant="titleSmall">
                <Translation
                    id="moduleSend.outputs.tokenOfNetworkSheet.title"
                    values={{ tokenSymbol, networkName }}
                />
            </Text>
            <Paragraph
                header={
                    <Translation id="moduleSend.outputs.tokenOfNetworkSheet.body.self.subtitle" />
                }
                body={
                    <Translation
                        id="moduleSend.outputs.tokenOfNetworkSheet.body.self.text"
                        values={{ networkName }}
                    />
                }
            />
            <Paragraph
                header={
                    <Translation id="moduleSend.outputs.tokenOfNetworkSheet.body.outside.subtitle" />
                }
                body={
                    <Translation
                        id="moduleSend.outputs.tokenOfNetworkSheet.body.outside.text"
                        values={{ networkName }}
                    />
                }
            />
            <AlertBox
                title={
                    <Text variant="callout" color="textDefault">
                        <Translation id="moduleSend.outputs.tokenOfNetworkSheet.warning" />
                    </Text>
                }
                variant="warning"
                borderRadius="r12"
            />
        </VStack>
    );
};
