import React, { useMemo } from 'react';
import styled from 'styled-components';

import { Select } from '@trezor/components';
import { Translation } from '@suite-components';
import { isDesktop } from '@suite-utils/env';

import type { Network } from '@wallet-types';
import type { BackendOption } from '@settings-hooks/backends';

const Capitalize = styled.span`
    text-transform: capitalize;
`;

const useBackendOptions = (network: Network) => {
    const options = useMemo(() => {
        const backends: BackendOption[] = [];

        // default backend for all coins except regtest
        if (network.symbol !== 'regtest') backends.push('default');

        // blockfrost backend only for cardano
        if (network.networkType === 'cardano') backends.push('blockfrost');

        // blockbook backend for all coins except ripple and cardano
        if (network.networkType !== 'ripple' && network.networkType !== 'cardano')
            backends.push('blockbook');

        // electrum backend only for bitcoin and regtest in desktop app
        if (['btc', 'regtest'].includes(network.symbol) && isDesktop()) backends.push('electrum');

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
    }, [network]);

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
            data-test="@settings/advance/select-type"
        />
    ) : null;
};
