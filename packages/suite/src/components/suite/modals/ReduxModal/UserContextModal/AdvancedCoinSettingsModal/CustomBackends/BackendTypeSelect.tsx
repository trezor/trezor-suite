import { useMemo } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectIsDebugModeActive } from '@suite/settings';
import { type Network } from '@suite-common/wallet-config';
import { Select } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';

import type { BackendOption } from 'src/hooks/settings/backends';
import { useSelector } from 'src/hooks/suite';

const Capitalize = styled.span`
    text-transform: capitalize;
`;

const useBackendOptions = (network: Network, isDebugModeActive: boolean) => {
    const getBackendLabel = (backend: string) => {
        switch (backend) {
            case 'default':
                return <Translation id="TR_BACKEND_DEFAULT_SERVERS" />;
            case 'evm-rpc':
                return <Translation id="TR_BACKEND_CUSTOM_RPC" />;
            default:
                return (
                    <Translation
                        id="TR_BACKEND_CUSTOM_SERVERS"
                        values={{
                            type: (
                                <Capitalize data-testid={`@settings/advance/${backend}`}>
                                    {backend}
                                </Capitalize>
                            ),
                        }}
                    />
                );
        }
    };

    return useMemo(
        () =>
            ['default', ...network.backendTypes]
                .filter(backend => {
                    switch (backend) {
                        case 'default':
                            return network.symbol !== 'regtest';
                        case 'electrum':
                            return isDesktop();
                        case 'evm-rpc':
                            return isDebugModeActive;
                        default:
                            return true;
                    }
                })
                .map(backend => ({
                    label: getBackendLabel(backend),
                    value: backend,
                })),
        [network, isDebugModeActive],
    );
};

type BackendTypeSelectProps = {
    network: Network;
    value: BackendOption;
    onChange: (type: BackendOption) => void;
};

export const BackendTypeSelect = ({ network, value, onChange }: BackendTypeSelectProps) => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const backendOptions = useBackendOptions(network, isDebugModeActive);

    if (!backendOptions.length) {
        return null;
    }

    return (
        <Select
            value={backendOptions.find(option => option.value === value)}
            openMenuOnFocus={false}
            onChange={option => {
                onChange(option.value);
            }}
            options={backendOptions}
            data-testid="@settings/advance/select-type"
            size="small"
        />
    );
};
