import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { getNetwork } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { InlineAlertBox, Text, VStack } from '@suite-native/atoms';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { type TokensRootState, selectAccountTokenSymbol } from '@suite-native/tokens';

type ParagraphProps = {
    header: ReactNode;
    body: ReactNode;
};

const Paragraph = ({ header, body }: ParagraphProps) => (
    <VStack spacing="sp4">
        <Text variant="body-md-strong">{header}</Text>
        <Text color="contentSecondary">{body}</Text>
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
            <Text variant="headline-sm">
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
            <InlineAlertBox
                title={<Translation id="moduleSend.outputs.tokenOfNetworkSheet.warning" />}
                variant="warning"
            />
        </VStack>
    );
};
