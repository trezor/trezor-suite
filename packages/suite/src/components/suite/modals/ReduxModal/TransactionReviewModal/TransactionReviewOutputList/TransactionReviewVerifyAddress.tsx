import { Translation } from '@suite/intl';
import { Card, Column, H3, H4, StepList, Text } from '@trezor/components';

import { TransactionReviewOutputTimer } from './TransactionReviewOutputTimer';

type VerifyAddressProps = {
    networkType: string;
    deadline?: number;
    onTryAgain: (close: boolean) => void;
    isSending?: boolean;
    // When the user typed an ENS name, both the original input ("vitalik.eth") and the
    // resolved hex are surfaced so the user can cross-check them against the resolved
    // address shown on the Trezor device.
    ensName?: string;
    resolvedAddress?: string;
};

export const TransactionReviewVerifyAddress = ({
    networkType,
    deadline,
    onTryAgain,
    isSending,
    ensName,
    resolvedAddress,
}: VerifyAddressProps) => (
    <Card>
        <Column gap={32}>
            <Column gap={16}>
                <H3>
                    <Translation id="TR_SEND_ADDRESS_CONFIRMATION_HEADING" />
                </H3>
                {ensName && (
                    <Column gap={2}>
                        <Text typographyStyle="body-sm" color="contentSecondary">
                            <Translation
                                id="TR_SEND_ADDRESS_CONFIRMATION_ENS_NOTE"
                                values={{ ensName }}
                            />
                        </Text>
                        {resolvedAddress && (
                            <Text typographyStyle="body-sm" color="contentSecondary">
                                <Translation
                                    id="TR_SEND_ADDRESS_CONFIRMATION_ENS_WALLET_ADDRESS"
                                    values={{ address: resolvedAddress }}
                                />
                            </Text>
                        )}
                    </Column>
                )}
                {networkType === 'solana' && deadline && (
                    <TransactionReviewOutputTimer
                        deadline={deadline}
                        onTryAgain={onTryAgain}
                        isSending={isSending}
                    />
                )}
            </Column>
            <StepList isOrdered bulletGap={16} titleGap={0} gap={32}>
                <StepList.Item
                    title={
                        <H4 typographyStyle="body-sm">
                            <Translation id="TR_SEND_ADDRESS_CONFIRMATION_ITEM_1_HEADING" />
                        </H4>
                    }
                />
                <StepList.Item
                    title={
                        <H4 typographyStyle="body-sm">
                            <Translation id="TR_SEND_ADDRESS_CONFIRMATION_ITEM_2_HEADING" />
                        </H4>
                    }
                />
                <StepList.Item
                    state="done"
                    title={
                        <H4 typographyStyle="body-sm">
                            <Translation id="TR_SEND_ADDRESS_CONFIRMATION_ITEM_3_HEADING" />
                        </H4>
                    }
                />
            </StepList>
        </Column>
    </Card>
);
