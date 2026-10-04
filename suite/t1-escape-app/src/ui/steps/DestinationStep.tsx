import { useState } from 'react';

import { Banner, Button, Card, Column, H2, Input, Paragraph } from '@trezor/components';

import type { DestinationError } from '../../bitcoin/destinationAddress';
import {
    type FirmwareVersion,
    isDestinationFormatSupported,
    showsAddressInProportionalFont,
} from '../../firmware/firmwareSupport';
import { BulletList } from '../BulletList';
import { describeDestinationError } from '../messages';

type DestinationStepProps = {
    firmwareVersion: FirmwareVersion;
    error?: DestinationError;
    isBusy: boolean;
    onSubmit: (address: string) => void;
};

export const DestinationStep = ({
    firmwareVersion,
    error,
    isBusy,
    onSubmit,
}: DestinationStepProps) => {
    // The field always starts empty. This tool never suggests or fills in an address.
    const [address, setAddress] = useState('');
    const isBech32Supported = isDestinationFormatSupported(firmwareVersion, 'bech32');

    return (
        <Card>
            <Column gap={16} alignItems="flex-start">
                <H2>Where should the bitcoin go?</H2>
                <Paragraph>
                    Enter one Bitcoin address. Everything that was found is sent to it. Take the
                    address from the wallet that should receive the bitcoin, ideally by confirming a
                    receive address on the display of your new Trezor.
                </Paragraph>
                <BulletList>
                    <BulletList.Item>
                        This firmware can send to addresses that start with{' '}
                        {isBech32Supported ? '1, 3 or bc1q' : '1 or 3'}.
                    </BulletList.Item>
                    <BulletList.Item>
                        Addresses that start with bc1p (Taproot) cannot be used.
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
                    bottomText={
                        error ? describeDestinationError(error, firmwareVersion) : undefined
                    }
                    onChange={event => setAddress(event.target.value)}
                />
                <Button isLoading={isBusy} onClick={() => onSubmit(address)}>
                    Prepare the transfers
                </Button>
            </Column>
        </Card>
    );
};
