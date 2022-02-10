import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Select } from '@trezor/components';
import { Translation } from '@suite-components';
import { isDesktop } from '@suite-utils/env';
import { useSelector } from '@suite-hooks';
import type { Network } from '@wallet-types';
import type { BackendOption } from '@settings-hooks/backends';

const Capitalize = styled.span`
    text-transform: capitalize;
`;

const useBackendOptions = (network: Network) => {
    const debug = useSelector(state => state.suite.settings.debug.showDebugMenu);

    const options = useMemo(() => {
        const backends: BackendOption[] = [];
        if (network.symbol !== 'regtest') backends.push('default');
        if (network.networkType === 'cardano') {
            backends.push('blockfrost');
        } else if (network.networkType !== 'ripple') {
            backends.push('blockbook');
        }
        if (['btc', 'regtest'].includes(network.symbol) && isDesktop() && debug)
            backends.push('electrum');

        return backends.map(backend => ({
            label:
                backend === 'default' ? (
                    <Translation id="TR_BACKEND_DEFAULT_SERVERS" />
                ) : (
                    <Translation
                        id="TR_BACKEND_CUSTOM_SERVERS"
                        values={{ type: <Capitalize>{backend}</Capitalize> }}
                    />
                ),
            value: backend,
        }));
    }, [network, debug]);

    return options;
};

type BackendTypeSelectProps = {
    network: Network;
    value: BackendOption;
    onChange: (type: BackendOption) => void;
};

export const BackendTypeSelect = ({ network, value, onChange }: BackendTypeSelectProps) => {
    const backendOptions = useBackendOptions(network);

    const changeType = (option: { value: BackendOption }) => onChange(option.value);

    return backendOptions.length ? (
        <Select
            value={backendOptions.find(option => option.value === value)}
            onChange={changeType}
            options={backendOptions}
            noTopLabel
            data-test="@settings/advance/select-type"
        />
    ) : null;
};
