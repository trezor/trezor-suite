import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { getNetwork } from '@suite-common/wallet-config';
import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { AlertBox, Text, VStack } from '@suite-native/atoms';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TokensRootState, selectAccountTokenSymbol } from '@suite-native/tokens';

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
    const tokenSymbol = useSelector((state: TokensRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenContract),
    );
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    if (!tokenContract || !symbol) return null;

    const networkName = getNetwork(symbol).name;

    return (
        <VStack spacing="sp24">
            <CryptoIconWithNetwork
                symbol={symbol}
                contractAddress={tokenContract}
                size="extraLarge"
            />
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
