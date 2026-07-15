import { Translation } from '@suite/intl';
import { Card, Column, H3, H4, StepList } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { TransactionReviewOutputTimer } from './TransactionReviewOutputTimer';

type VerifyAddressProps = {
    networkType: string;
    deadline?: number;
    onTryAgain: (close: boolean) => void;
    isSending?: boolean;
};

export const TransactionReviewVerifyAddress = ({
    networkType,
    deadline,
    onTryAgain,
    isSending,
}: VerifyAddressProps) => (
    <Card>
        <Column gap={spacings.xxl}>
            <Column gap={spacings.md}>
                <H3>
                    <Translation id="TR_SEND_ADDRESS_CONFIRMATION_HEADING" />
                </H3>
                {networkType === 'solana' && deadline && (
                    <TransactionReviewOutputTimer
                        deadline={deadline}
                        onTryAgain={onTryAgain}
                        isSending={isSending}
                    />
                )}
            </Column>
            <StepList isOrdered bulletGap={spacings.md} titleGap={spacings.zero} gap={spacings.xxl}>
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
