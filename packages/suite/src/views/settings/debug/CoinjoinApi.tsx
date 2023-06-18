import React from 'react';
import styled from 'styled-components';

import { Switch } from '@trezor/components';
import { COINJOIN_NETWORKS } from 'src/services/coinjoin';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from 'src/components/suite/Settings';
import * as coinjoinClientActions from 'src/actions/wallet/coinjoinClientActions';
import { useSelector, useActions } from 'src/hooks/suite';
import { CoinjoinServerEnvironment } from 'src/types/wallet/coinjoin';
import { NetworkSymbol, networks } from '@suite-common/wallet-config';
import { reloadApp } from 'src/utils/suite/reload';

const StyledActionSelect = styled(ActionSelect)`
    min-width: 256px;
`;

interface CoordinatorServerProps {
    symbol: NetworkSymbol;
    environments: CoinjoinServerEnvironment[];
    value?: CoinjoinServerEnvironment;
    onChange: (network: NetworkSymbol, value: CoinjoinServerEnvironment) => void;
}

const CoordinatorServer = ({ symbol, environments, value, onChange }: CoordinatorServerProps) => {
    const options = environments.map(environment => ({
        label: environment,
        value: environment,
    }));

    const selectedOption = (value && options.find(option => option.value === value)) ?? options[0];
    const networkName = networks[symbol].name;

    return (
        <SectionItem data-test={`@settings/debug/coinjoin/${symbol}`}>
            <TextColumn
                title={networkName}
                description={`${networkName} coordinator server configuration`}
            />
            <ActionColumn>
                <StyledActionSelect
                    isDisabled={options.length < 2}
                    onChange={({ value }) => onChange(symbol, value)}
                    value={selectedOption}
                    options={options}
                    data-test={`@settings/debug/coinjoin/${symbol}/server-select`}
                />
            </ActionColumn>
        </SectionItem>
    );
};

export const CoinjoinApi = () => {
    const { setDebugSettings } = useActions({
        setDebugSettings: coinjoinClientActions.setDebugSettings,
    });
    const debug = useSelector(state => state.wallet.coinjoin.debug);

    const handleServerChange: CoordinatorServerProps['onChange'] = (network, value) => {
        setDebugSettings({
            coinjoinServerEnvironment: {
                [network]: value,
            },
        });
        // reload the Suite to reinitialize everything, with a slight delay to let the browser save the settings
        reloadApp(100);
    };

    const handleTorChange = () => {
        setDebugSettings({
            coinjoinAllowNoTor: !debug?.coinjoinAllowNoTor,
        });
    };

    return (
        <>
            {(Object.keys(COINJOIN_NETWORKS) as NetworkSymbol[]).map(symbol => {
                const environments = Object.keys(
                    COINJOIN_NETWORKS[symbol] || {},
                ) as CoinjoinServerEnvironment[];
                return (
                    <CoordinatorServer
                        key={symbol}
                        symbol={symbol}
                        environments={environments}
                        value={
                            debug?.coinjoinServerEnvironment &&
                            debug?.coinjoinServerEnvironment[symbol]
                        }
                        onChange={handleServerChange}
                    />
                );
            })}
            <SectionItem data-test="@settings/debug/coinjoin-allow-no-tor">
                <TextColumn
                    title="Allow no Tor"
                    description="Normally, coinjoin is allowed only when Tor is running. You may allow coinjoin without running Tor"
                />
                <ActionColumn>
                    <Switch
                        onChange={handleTorChange}
                        isChecked={debug?.coinjoinAllowNoTor ?? false}
                        data-test="@settings/debug/coinjoin/allow-no-tor-checkbox"
                    />
                </ActionColumn>
            </SectionItem>
        </>
    );
};
