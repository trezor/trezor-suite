import { useState } from 'react';

import { Banner, Button, Card, Column, H2, Input, Paragraph } from '@trezor/components';

import { ETHEREUM_CHAIN_DEFINITIONS, type EthereumChain } from '../../ethereum/ethereumChain';
import type { EthereumDestinationError } from '../../ethereum/ethereumDestination';
import {
    type FirmwareVersion,
    showsAddressInProportionalFont,
} from '../../firmware/firmwareSupport';
import { BulletList } from '../BulletList';
import { describeEthereumDestinationError } from '../ethereumMessages';

type EthereumDestinationStepProps = {
    chain: EthereumChain;
    firmwareVersion: FirmwareVersion;
    error?: EthereumDestinationError;
    isBusy: boolean;
    onSubmit: (address: string) => void;
};

export const EthereumDestinationStep = ({
    chain,
    firmwareVersion,
    error,
    isBusy,
    onSubmit,
}: EthereumDestinationStepProps) => {
    // The field always starts empty. This tool never suggests or fills in an address.
    const [address, setAddress] = useState('');
    const { label, symbol } = ETHEREUM_CHAIN_DEFINITIONS[chain];

    return (
        <Card>
            <Column gap={16} alignItems="flex-start">
                <H2>Where should the {symbol} go?</H2>
                <Paragraph>
                    Enter one {label} address. Everything that was found is sent to it, one
                    transaction per address. Take the address from the wallet that should receive
                    the {symbol}, ideally by confirming a receive address on the display of your new
                    Trezor.
                </Paragraph>
                <BulletList>
                    <BulletList.Item>
                        The address starts with 0x and has 40 more characters. Capital letters in it
                        are a checksum: if you type one wrong, the address is refused.
                    </BulletList.Item>
                    <BulletList.Item>
                        Use an address of a wallet you control, not an exchange deposit address and
                        not a contract. The whole balance minus the fee goes there.
                    </BulletList.Item>
                    <BulletList.Item>
                        The old Trezor will show the address before it signs. Compare it there with
                        your new wallet, character by character.
                    </BulletList.Item>
                </BulletList>
                {showsAddressInProportionalFont(firmwareVersion) && (
                    <Banner
                        intent="warning"
                        description="This firmware shows addresses in a font in which similar characters, such as l, I and 1, are hard to tell apart. Take your time comparing."
                    />
                )}
                <Input
                    label="Destination address"
                    autoComplete="off"
                    spellCheck={false}
                    value={address}
                    hasError={error !== undefined}
                    bottomText={error ? describeEthereumDestinationError(error) : undefined}
                    onChange={event => setAddress(event.target.value)}
                />
                <Button isLoading={isBusy} onClick={() => onSubmit(address)}>
                    Prepare the transfers
                </Button>
            </Column>
        </Card>
    );
};
