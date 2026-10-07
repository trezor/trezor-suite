import { Banner, Button, Card, Column, H2, Paragraph, Row } from '@trezor/components';

import type { Coin } from '../../app/migrationState';
import {
    type FirmwareVersion,
    MIN_ETHEREUM_FIRMWARE,
    formatFirmwareVersion,
    isEthereumSupported,
} from '../../firmware/firmwareSupport';
import { BulletList } from '../BulletList';

type CoinStepProps = {
    firmwareVersion: FirmwareVersion;
    isBusy: boolean;
    onChoose: (coin: Coin) => void;
};

export const CoinStep = ({ firmwareVersion, isBusy, onChoose }: CoinStepProps) => {
    const hasEthereum = isEthereumSupported(firmwareVersion);

    return (
        <Card>
            <Column gap={16} alignItems="flex-start">
                <H2>What do you want to move?</H2>
                <Paragraph>
                    One coin at a time. Bitcoin is moved account by account; Ethereum and Ethereum
                    Classic address by address. Reload the page afterwards to move another coin.
                </Paragraph>
                <BulletList>
                    <BulletList.Item>
                        Bitcoin: Legacy, Legacy SegWit and SegWit accounts.
                    </BulletList.Item>
                    <BulletList.Item>
                        Ethereum and Ethereum Classic: the coin itself only. ERC-20 tokens and NFTs
                        are not moved; they are listed at the end so that you know they are there.
                    </BulletList.Item>
                </BulletList>
                {!hasEthereum && (
                    <Banner
                        intent="info"
                        description={`Firmware ${formatFirmwareVersion(firmwareVersion)} cannot sign Ethereum transactions that today's network accepts. Ethereum and Ethereum Classic need firmware ${formatFirmwareVersion(MIN_ETHEREUM_FIRMWARE)} or newer.`}
                    />
                )}
                <Row gap={8} flexWrap="wrap">
                    <Button isDisabled={isBusy} onClick={() => onChoose('bitcoin')}>
                        Bitcoin
                    </Button>
                    <Button
                        priority="secondary"
                        isDisabled={isBusy || !hasEthereum}
                        onClick={() => onChoose('ethereum')}
                    >
                        Ethereum
                    </Button>
                    <Button
                        priority="secondary"
                        isDisabled={isBusy || !hasEthereum}
                        onClick={() => onChoose('ethereum-classic')}
                    >
                        Ethereum Classic
                    </Button>
                </Row>
            </Column>
        </Card>
    );
};
