import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import {
    formatMessageValue,
    getSignerAddress,
    selectTradingExchangeSelectedQuote,
    simplifyJSON,
} from '@suite-common/trading';
import { Card, Text, VStack } from '@suite-native/atoms';
import { AddressFormatter } from '@suite-native/formatters';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

type TypedDataDomain = {
    name?: string;
    version?: string;
    chainId?: number | bigint | string;
    verifyingContract?: string;
    salt?: ArrayBuffer | string;
};

type TypedDataPayload = {
    domain?: TypedDataDomain;
    primaryType?: string;
    message?: Record<string, unknown>;
};

type SignDataCardProps = {
    titleId: TxKeyPath;
    children: ReactNode;
};

const SignDataCard = ({ titleId, children }: SignDataCardProps) => (
    <Card>
        <VStack spacing="sp8">
            <Text variant="body-sm-strong">
                <Translation id={titleId} />
            </Text>
            <Text variant="body-sm" selectable>
                {children}
            </Text>
        </VStack>
    </Card>
);

type MessageFieldRowProps = {
    label: string;
    value: unknown;
};

const MessageFieldRow = ({ label, value }: MessageFieldRowProps) => (
    <VStack spacing="sp2">
        <Text variant="body-xs" color="contentSecondary">
            {label}
        </Text>
        <Text variant="body-sm" selectable>
            {formatMessageValue(value)}
        </Text>
    </VStack>
);

const MessageCard = ({ message }: { message: Record<string, unknown> }) => (
    <Card>
        <VStack spacing="sp12">
            <Text variant="body-sm-strong">
                <Translation id="moduleTrading.tradingReviewOutputs.signData.message" />
            </Text>
            {Object.entries(message).map(([key, value]) => (
                <MessageFieldRow key={key} label={key} value={value} />
            ))}
        </VStack>
    </Card>
);

export const SignDataMessageReview = () => {
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);
    const signData = quote?.signData;

    if (signData?.type !== 'eip712-typed-data') {
        console.warn('SignDataMessageReview: signData is not eip712-typed-data', { signData });

        return null;
    }

    const data =
        signData.data && typeof signData.data === 'object'
            ? (signData.data as TypedDataPayload)
            : {};
    const { domain, message } = data;
    const signerAddress = getSignerAddress(sendAccount);

    return (
        <VStack spacing="sp12">
            <Text variant="body-md-strong">
                <Translation id="moduleTrading.tradingReviewOutputs.signData.heading" />
            </Text>
            {signerAddress && (
                <Card>
                    <VStack spacing="sp8">
                        <Text variant="body-sm-strong">
                            <Translation id="moduleTrading.tradingReviewOutputs.signData.address" />
                        </Text>
                        <AddressFormatter
                            value={signerAddress}
                            format="full"
                            variant="body-sm"
                            selectable
                        />
                    </VStack>
                </Card>
            )}
            {domain && (
                <SignDataCard titleId="moduleTrading.tradingReviewOutputs.signData.domain">
                    {simplifyJSON(domain)}
                </SignDataCard>
            )}
            {message && <MessageCard message={message} />}
        </VStack>
    );
};
