import { Banner, Button, Card, Column, H2, Paragraph } from '@trezor/components';

import { BulletList } from '../BulletList';

type IntroStepProps = {
    onStart: () => void;
};

export const IntroStep = ({ onStart }: IntroStepProps) => (
    <Column gap={16}>
        <Banner
            intent="critical"
            title="This tool never asks for your recovery seed"
            description="Do not type your recovery seed into this page, into any other website, or into any application. Nobody from Trezor will ask for it."
        />
        <Card>
            <Column gap={16} alignItems="flex-start">
                <H2>What this tool does</H2>
                <Paragraph>
                    It is for owners of an old Trezor One who no longer have their recovery seed and
                    therefore cannot safely update the firmware. It finds the bitcoin, ether and
                    ether classic on the device and sends all of it to addresses that you provide,
                    one per coin, for example receive addresses of a new Trezor.
                </Paragraph>
                <BulletList>
                    <BulletList.Item>
                        The Trezor is reached through the Trezor Suite desktop app. Install it,
                        start it, and leave it running.
                    </BulletList.Item>
                    <BulletList.Item>
                        You need Windows or macOS, and Chrome, Edge, Brave or Firefox.
                    </BulletList.Item>
                    <BulletList.Item>
                        Bitcoin, Ethereum and Ethereum Classic are moved, all in one go. Ethereum
                        needs firmware 1.4.2 or newer. ERC-20 tokens, NFTs and other coins are not
                        touched.
                    </BulletList.Item>
                    <BulletList.Item>
                        Nothing is stored in your browser. If you reload the page, you start again.
                    </BulletList.Item>
                </BulletList>
                <Banner
                    intent="warning"
                    description="Firmware this old has known weaknesses. Read each screen, compare everything the Trezor shows with this page, and stop if anything differs."
                />
                <Button onClick={onStart}>Start</Button>
            </Column>
        </Card>
    </Column>
);
