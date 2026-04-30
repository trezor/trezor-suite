import { Button, Card, Column, Input, Text } from '@trezor/components';

type SparkSendViewProps = {
    amountSats: string;
    invoice: string;
    isSubmitDisabled: boolean;
    onAmountChange: (value: string) => void;
    onInvoiceChange: (value: string) => void;
    onSubmit: () => void;
};

export const SparkSendView = ({
    amountSats,
    invoice,
    isSubmitDisabled,
    onAmountChange,
    onInvoiceChange,
    onSubmit,
}: SparkSendViewProps) => (
    <Card>
        <Column gap={16}>
            <Text typographyStyle="body-md-strong">Send Spark over Lightning</Text>
            <Text color="contentSecondary">
                Paste a Lightning invoice. Amount is only needed for zero-amount invoices.
            </Text>
            <Input
                value={invoice}
                onChange={event => onInvoiceChange(event.target.value)}
                label="Lightning invoice"
            />
            <Input
                value={amountSats}
                onChange={event => onAmountChange(event.target.value)}
                inputMode="numeric"
                label="Amount in sats (optional)"
            />
            <Button onClick={onSubmit} isDisabled={isSubmitDisabled}>
                Send Spark payment
            </Button>
        </Column>
    </Card>
);
