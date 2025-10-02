import { useMemo } from 'react';

import styled from 'styled-components';

import { Network } from '@suite-common/wallet-config';
import { Select } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';

import { Translation } from 'src/components/suite/Translation';
import type { BackendOption } from 'src/hooks/settings/backends';

const Capitalize = styled.span`
    text-transform: capitalize;
`;

const useBackendOptions = (
    network: Network,
): {
    label: React.JSX.Element;
    value: BackendOption;
}[] =>
    useMemo(
        () =>
            ['default', ...network.backendTypes]
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
                                        <Capitalize data-testid={`@settings/advance/${backend}`}>
                                            {backend}
                                        </Capitalize>
                                    ),
                                }}
                            />
                        ),
                    value: backend as BackendOption,
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
