import { useMemo } from 'react';
import styled from 'styled-components';

import { Select } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { isDesktop } from '@trezor/env-utils';

import type { Network } from 'src/types/wallet';
import type { BackendOption } from 'src/hooks/settings/backends';

const Capitalize = styled.span`
    text-transform: capitalize;
`;

const useBackendOptions = (network: Network) =>
    useMemo(
        () =>
            ['default', ...network.customBackends]
                .filter(backend => {
                    switch (backend) {
                        case 'default':
                            return network.symbol !== 'regtest';
                        case 'electrum':
                            return isDesktop();
                        default:
                            return true;
                    }
                })
                .map(backend => ({
                    label:
                        backend === 'default' ? (
                            <Translation id="TR_BACKEND_DEFAULT_SERVERS" />
                        ) : (
                            <Translation
                                id="TR_BACKEND_CUSTOM_SERVERS"
                                values={{
                                    type: (
                                        <Capitalize data-test={`@settings/advance/${backend}`}>
                                            {backend}
                                        </Capitalize>
                                    ),
                                }}
                            />
                        ),
                    value: backend,
                })),
        [network],
    );

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
