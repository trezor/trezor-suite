import React from 'react';
import styled from 'styled-components';
import { Select } from '@trezor/components';
import { Translation } from '@suite-components';
import type { Network } from '@wallet-types';
import type { BackendOption } from '@settings-hooks/backends';

const Capitalize = styled.span`
    text-transform: capitalize;
`;

const getBackendOptions = (network: Network) => {
    const backends: BackendOption[] = [];
    if (network.symbol !== 'regtest') backends.push('default');
    if (network.networkType !== 'ripple') backends.push('blockbook');
    // if (network.symbol === 'btc') backends.push('electrum');
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
};

type BackendTypeSelectProps = {
    network: Network;
    value: BackendOption;
    onChange: (type: BackendOption) => void;
};

export const BackendTypeSelect = ({ network, value, onChange }: BackendTypeSelectProps) => {
    const backendOptions = getBackendOptions(network);

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
