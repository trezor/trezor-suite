import { ReactNode } from 'react';

import { Button, Card, Column, Divider, Icon, IconName, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

type BluetoothTipProps = {
    icon: IconName;
    header: string;
    text: string;
};

const BluetoothTip = ({ icon, header, text }: BluetoothTipProps) => (
    <Row width="100%" gap={spacings.md} justifyContent="stretch" alignItems="center">
        <Icon name={icon} />
        <Column alignItems="stretch">
            <Text typographyStyle="hint">{header}</Text>
            <Text typographyStyle="hint" variant="tertiary">
                {text}
            </Text>
        </Column>
    </Row>
);

type BluetoothTipsProps = {
    onReScanClick: () => void;
    header: ReactNode;
};

export const BluetoothTips = ({ onReScanClick, header }: BluetoothTipsProps) => (
    <Card>
        <Column gap={spacings.md} alignItems="stretch">
            <Row width="100%" gap={spacings.md} justifyContent="space-between" alignItems="center">
                <Text typographyStyle="body">{header}</Text>
                <Button variant="primary" size="small" onClick={onReScanClick}>
                    Scan again
                </Button>
            </Row>
            <Divider margin={{ vertical: 0, horizontal: 0 }} />
            <Column gap={spacings.md} alignItems="stretch">
                <BluetoothTip
                    icon="desktop"
                    header="Your Trezor Safe 7 is within 7km from computer"
                    text="Because like... you know."
                />
                <BluetoothTip
                    icon="trezor"
                    header="Your Trezor Safe 7 is within 7km from computer"
                    text="Hold power button for 3s"
                />
                <BluetoothTip
                    icon="usb"
                    header="Your Trezor Safe 7 is in pairing mode"
                    text="Idk, need more info, this is just a template"
                />
            </Column>
        </Column>
    </Card>
);
