import React from 'react';
import styled from 'styled-components';

import { Switch } from '@trezor/components';
import { COINJOIN_NETWORKS } from '@suite/services/coinjoin/config';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from '@suite-components/Settings';
import * as suiteActions from '@suite-actions/suiteActions';
import { useSelector, useActions } from '@suite-hooks';
import type { CoinjoinServerEnvironment } from '@suite-common/wallet-types';

const StyledActionSelect = styled(ActionSelect)`
    min-width: 256px;
`;

export const CoinjoinApi = () => {
    const { setDebugMode } = useActions({
        setDebugMode: suiteActions.setDebugMode,
    });
    const { debug } = useSelector(state => ({
        debug: state.suite.settings.debug,
    }));

    const options = Object.keys(COINJOIN_NETWORKS.regtest!).map(environment => ({
        label: environment,
        value: environment,
    }));
    const selectedOption =
        options.find(option => option.value === debug.coinjoinRegtestServerEnvironment) ||
        options[0];

    const handleApiChange = (item: { value: CoinjoinServerEnvironment }) => {
        setDebugMode({
            coinjoinRegtestServerEnvironment: item.value,
        });
    };

    const handleTorChange = () => {
        setDebugMode({
            coinjoinAllowNoTor: !debug.coinjoinAllowNoTor,
        });
    };

    return (
        <>
            <SectionItem data-test="@settings/debug/coinjoin-api">
                <TextColumn title="Coinjoin" description="Coinjoin Regtest server" />
                <ActionColumn>
                    <StyledActionSelect
                        onChange={handleApiChange}
                        value={selectedOption}
                        options={options}
                        data-test="@settings/coinjoin-server-select"
                    />
                </ActionColumn>
            </SectionItem>
            <SectionItem data-test="@settings/debug/coinjoin-allow-no-tor">
                <TextColumn
                    title="Allow no Tor"
                    description="Normally, Coinjoin is allowed only when Tor is running. You may allow coinjoin without running Tor"
                />
                <ActionColumn>
                    <Switch
                        onChange={handleTorChange}
                        isChecked={debug.coinjoinAllowNoTor}
                        data-test="@settings/coinjoin-allow-no-tor-checkbox"
                    />
                </ActionColumn>
            </SectionItem>
        </>
    );
};
