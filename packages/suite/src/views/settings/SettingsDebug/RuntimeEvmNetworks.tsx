import { type FormEvent, useState } from 'react';

import { Badge, Button, Column, Input, Row, Switch, Text } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import type {
    RuntimeEvmNetwork,
    RuntimeEvmNetworkDefinition,
} from '@trezor/network-ethereum-suite-common';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useRuntimeEvmNetworkRegistry } from 'src/hooks/wallet/chainData/useRuntimeEvmNetworkRegistry';
import {
    type RuntimeEvmNetworkInput,
    checkRuntimeEvmNetworkInput,
} from 'src/support/runtimeEvmNetworks/checkRuntimeEvmNetworkInput';

// Runtime EVM networks are a debug feature; its texts are not translated yet.
const SOURCE_LABEL: Record<RuntimeEvmNetworkDefinition['source'], string> = {
    trezor: 'Trezor-listed',
    user: 'Added by you',
};

const EMPTY_INPUT: RuntimeEvmNetworkInput = {
    name: '',
    chainId: '',
    symbol: '',
    nativeSymbol: '',
    rpcUrl: '',
    explorerUrl: '',
};

const INPUT_FIELDS: { key: keyof RuntimeEvmNetworkInput; label: string; placeholder: string }[] = [
    { key: 'name', label: 'Name', placeholder: 'Example Chain' },
    { key: 'chainId', label: 'Chain ID', placeholder: '777' },
    { key: 'symbol', label: 'Network symbol', placeholder: 'exc' },
    { key: 'nativeSymbol', label: 'Coin symbol (18 decimals)', placeholder: 'EXC' },
    { key: 'rpcUrl', label: 'RPC URL', placeholder: 'https://rpc.example.com' },
    {
        key: 'explorerUrl',
        label: 'Explorer URL (optional)',
        placeholder: 'https://explorer.example.com',
    },
];

const getHosts = (definition: RuntimeEvmNetworkDefinition) =>
    definition.rpcUrls.map(url => new URL(url).host).join(', ');

const getRpcChainId = async (url: string) => {
    const result = await TrezorConnect.blockchainEvmRpcGetChainId({ url });

    return result.success ? result.payload.chainId : null;
};

type RuntimeEvmNetworkItemProps = { network: RuntimeEvmNetwork };

const RuntimeEvmNetworkItem = ({ network }: RuntimeEvmNetworkItemProps) => {
    const { registry } = useRuntimeEvmNetworkRegistry();
    const { definition, key, isEnabled } = network;
    const { symbol, source } = definition;

    const handleToggle = () => {
        registry.setEnabled(key, !isEnabled);
    };
    const handleRemove = () => {
        registry.removeUserDefinition(symbol);
    };

    return (
        <SectionItem data-testid={`@settings/debug/runtime-evm/${symbol}`}>
            <TextColumn
                title={definition.name}
                description={
                    `${definition.nativeSymbol} on chain ${definition.chainId}. ` +
                    `Turned on, your Ethereum addresses are sent to ${getHosts(definition)}` +
                    (source === 'user' ? ', a node you chose and Trezor does not check.' : '.')
                }
                bottomContent={<Badge size="small">{SOURCE_LABEL[source]}</Badge>}
            />
            <ActionColumn>
                <Row gap={12}>
                    {source === 'user' && (
                        <Button
                            size="small"
                            intent="neutral"
                            priority="secondary"
                            onClick={handleRemove}
                        >
                            Remove
                        </Button>
                    )}
                    <Switch isChecked={isEnabled} onChange={handleToggle} />
                </Row>
            </ActionColumn>
        </SectionItem>
    );
};

type ShadowedRuntimeEvmNetworkItemProps = { definition: RuntimeEvmNetworkDefinition };

const ShadowedRuntimeEvmNetworkItem = ({ definition }: ShadowedRuntimeEvmNetworkItemProps) => {
    const { registry } = useRuntimeEvmNetworkRegistry();

    const handleRemove = () => {
        registry.removeUserDefinition(definition.symbol);
    };

    return (
        <SectionItem>
            <TextColumn
                title={definition.name}
                description="Not used: a Trezor-listed network has the same symbol or chain ID."
            />
            <ActionColumn>
                <Button size="small" intent="neutral" priority="secondary" onClick={handleRemove}>
                    Remove
                </Button>
            </ActionColumn>
        </SectionItem>
    );
};

const AddRuntimeEvmNetworkForm = () => {
    const { snapshot, registry } = useRuntimeEvmNetworkRegistry();
    const [input, setInput] = useState(EMPTY_INPUT);
    const [error, setError] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setIsChecking(true);
        setError(null);

        const check = await checkRuntimeEvmNetworkInput(input, {
            ...snapshot.reservations,
            getRpcChainId,
        });

        setIsChecking(false);
        if (!check.success) {
            setError(check.message);

            return;
        }

        registry.addUserDefinition(check.definition);
        setInput(EMPTY_INPUT);
    };

    return (
        <SectionItem>
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <Column gap={12} alignItems="stretch">
                    <TextColumn
                        title="Add an EVM network"
                        description="Its node must serve the chain ID you enter. It stays off until you turn it on."
                    />
                    {INPUT_FIELDS.map(({ key, label, placeholder }) => (
                        <Input
                            key={key}
                            data-testid={`@settings/debug/runtime-evm/input/${key}`}
                            label={label}
                            placeholder={placeholder}
                            value={input[key]}
                            onChange={event =>
                                setInput(current => ({ ...current, [key]: event.target.value }))
                            }
                        />
                    ))}
                    {error && (
                        <Text intent="critical" data-testid="@settings/debug/runtime-evm/error">
                            {error}
                        </Text>
                    )}
                    <Row justifyContent="flex-end">
                        <Button
                            type="submit"
                            size="small"
                            isLoading={isChecking}
                            data-testid="@settings/debug/runtime-evm/add"
                        >
                            Add network
                        </Button>
                    </Row>
                </Column>
            </form>
        </SectionItem>
    );
};

/**
 * EVM networks defined at runtime: listed by Trezor or added by the user, each read over its own
 * nodes once the user turns it on. Behind the `queryChainData` flag, which reads them.
 */
export const RuntimeEvmNetworks = () => {
    const { snapshot } = useRuntimeEvmNetworkRegistry();

    // Runtime networks are read only while chain data comes from chain networks.
    if (!snapshot.isActive) {
        return (
            <SectionItem>
                <TextColumn
                    title="Custom EVM networks"
                    description="Turn on the queryChainData flag to use EVM networks defined at runtime."
                />
            </SectionItem>
        );
    }

    return (
        <>
            {snapshot.networks.map(network => (
                <RuntimeEvmNetworkItem key={network.key} network={network} />
            ))}
            {snapshot.shadowedUserDefinitions.map(definition => (
                <ShadowedRuntimeEvmNetworkItem
                    key={`shadowed-${definition.symbol}`}
                    definition={definition}
                />
            ))}
            <AddRuntimeEvmNetworkForm />
        </>
    );
};
