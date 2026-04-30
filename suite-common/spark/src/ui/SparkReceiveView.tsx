import { Button, Card, Column, Row, Text } from '@trezor/components';

type SparkReceiveViewProps = {
    bitcoinDepositAddress: string;
    lightningInvoice: string;
    lightningQrCode?: React.ReactNode;
    onCopyBitcoinAddress: () => void;
    onCopyLightningInvoice: () => void;
    onRefreshLightningInvoice: () => void;
};

export const SparkReceiveView = ({
    bitcoinDepositAddress,
    lightningInvoice,
    lightningQrCode,
    onCopyBitcoinAddress,
    onCopyLightningInvoice,
    onRefreshLightningInvoice,
}: SparkReceiveViewProps) => (
    <Column gap={16}>
        <Card>
            <Column gap={12}>
                <Text typographyStyle="body-md-strong">Deposit from Bitcoin on-chain</Text>
                <Text color="contentSecondary">
                    Copy this Bitcoin deposit address and fund it manually from your external
                    wallet.
                </Text>
                <Text>{bitcoinDepositAddress}</Text>
                <Row gap={8}>
                    <Button onClick={onCopyBitcoinAddress}>Copy address</Button>
                </Row>
            </Column>
        </Card>

        <Card>
            <Column gap={12}>
                <Text typographyStyle="body-md-strong">Deposit over Lightning</Text>
                <Text color="contentSecondary">
                    This Lightning invoice can be shared directly or scanned with a Lightning
                    wallet.
                </Text>
                {lightningQrCode}
                <Text>{lightningInvoice}</Text>
                <Row gap={8}>
                    <Button onClick={onCopyLightningInvoice}>Copy invoice</Button>
                    <Button
                        intent="neutral"
                        priority="secondary"
                        onClick={onRefreshLightningInvoice}
                    >
                        Refresh invoice
                    </Button>
                </Row>
            </Column>
        </Card>
    </Column>
);
