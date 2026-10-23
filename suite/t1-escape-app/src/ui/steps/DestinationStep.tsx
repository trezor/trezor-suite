import { useState } from 'react';

import { Banner, Button, Card, Column, H2, H4, Input, Paragraph } from '@trezor/components';

import { type Coin, type DestinationInputs, isEthereumChain } from '../../app/migrationState';
import type { DestinationError } from '../../bitcoin/destinationAddress';
import { ETHEREUM_CHAIN_DEFINITIONS, type EthereumChain } from '../../ethereum/ethereumChain';
import type { EthereumDestinationError } from '../../ethereum/ethereumDestination';
import {
    type FirmwareVersion,
    isDestinationFormatSupported,
    showsAddressInProportionalFont,
} from '../../firmware/firmwareSupport';
import { BulletList } from '../BulletList';
import { describeEthereumDestinationError } from '../ethereumMessages';
import { describeDestinationError } from '../messages';

type DestinationStepProps = {
    firmwareVersion: FirmwareVersion;
    /** The coins that have something to move, in the order their fields are shown. */
    coins: readonly Coin[];
    bitcoinError?: DestinationError;
    ethereumErrors: Record<EthereumChain, EthereumDestinationError | undefined>;
    isBusy: boolean;
    onSubmit: (inputs: DestinationInputs) => void;
};

type BitcoinDestinationFieldProps = {
    firmwareVersion: FirmwareVersion;
    value: string;
    error?: DestinationError;
    onChange: (value: string) => void;
};

const BitcoinDestinationField = ({
    firmwareVersion,
    value,
    error,
    onChange,
}: BitcoinDestinationFieldProps) => {
    const isBech32Supported = isDestinationFormatSupported(firmwareVersion, 'bech32');

    return (
        <Column gap={8} width="100%">
            <H4>Bitcoin</H4>
            <BulletList>
                <BulletList.Item>
                    This firmware can send to addresses that start with{' '}
                    {isBech32Supported ? '1, 3 or bc1q' : '1 or 3'}.
                </BulletList.Item>
                <BulletList.Item>
                    Addresses that start with bc1p (Taproot) cannot be used.
                </BulletList.Item>
            </BulletList>
            <Input
                label="Bitcoin destination address"
                autoComplete="off"
                spellCheck={false}
                value={value}
                hasError={error !== undefined}
                bottomText={error ? describeDestinationError(error, firmwareVersion) : undefined}
                onChange={event => onChange(event.target.value)}
            />
        </Column>
    );
};

type EthereumDestinationFieldProps = {
    chain: EthereumChain;
    value: string;
    error?: EthereumDestinationError;
    onChange: (value: string) => void;
};

const EthereumDestinationField = ({
    chain,
    value,
    error,
    onChange,
}: EthereumDestinationFieldProps) => {
    const { label } = ETHEREUM_CHAIN_DEFINITIONS[chain];

    return (
        <Column gap={8} width="100%">
            <H4>{label}</H4>
            <BulletList>
                <BulletList.Item>
                    The address starts with 0x and has 40 more characters. Capital letters in it are
                    a checksum: if you type one wrong, the address is refused.
                </BulletList.Item>
                <BulletList.Item>
                    Use an address of a wallet you control, not an exchange deposit address and not
                    a contract. The whole balance minus the fee goes there, one transaction per
                    address.
                </BulletList.Item>
                {chain === 'ethereum-classic' && (
                    <BulletList.Item>
                        It may be the same address as for Ethereum, as long as your new wallet lets
                        you use it on Ethereum Classic.
                    </BulletList.Item>
                )}
            </BulletList>
            <Input
                label={`${label} destination address`}
                autoComplete="off"
                spellCheck={false}
                value={value}
                hasError={error !== undefined}
                bottomText={error ? describeEthereumDestinationError(error) : undefined}
                onChange={event => onChange(event.target.value)}
            />
        </Column>
    );
};

export const DestinationStep = ({
    firmwareVersion,
    coins,
    bitcoinError,
    ethereumErrors,
    isBusy,
    onSubmit,
}: DestinationStepProps) => {
    // The fields always start empty. This tool never suggests or fills in an address.
    const [inputs, setInputs] = useState<DestinationInputs>({});

    const setInput = (coin: Coin, value: string) =>
        setInputs(current => ({ ...current, [coin]: value }));

    return (
        <Card>
            <Column gap={16} alignItems="flex-start">
                <H2>Where should the coins go?</H2>
                <Paragraph>
                    Enter one address per coin. Everything that was found is sent there. Take each
                    address from the wallet that should receive the coins, ideally by confirming a
                    receive address on the display of your new Trezor.
                </Paragraph>
                <BulletList>
                    <BulletList.Item>
                        The old Trezor will show each address before it signs. Compare it there with
                        your new wallet, character by character.
                    </BulletList.Item>
                </BulletList>
                {showsAddressInProportionalFont(firmwareVersion) && (
                    <Banner
                        intent="warning"
                        description="This firmware shows addresses in a font in which similar characters, such as l, I and 1, are hard to tell apart. Take your time comparing."
                    />
                )}
                {coins.map(coin =>
                    isEthereumChain(coin) ? (
                        <EthereumDestinationField
                            key={coin}
                            chain={coin}
                            value={inputs[coin] ?? ''}
                            error={ethereumErrors[coin]}
                            onChange={value => setInput(coin, value)}
                        />
                    ) : (
                        <BitcoinDestinationField
                            key={coin}
                            firmwareVersion={firmwareVersion}
                            value={inputs[coin] ?? ''}
                            error={bitcoinError}
                            onChange={value => setInput(coin, value)}
                        />
                    ),
                )}
                <Button isLoading={isBusy} onClick={() => onSubmit(inputs)}>
                    Prepare the transfers
                </Button>
            </Column>
        </Card>
    );
};
