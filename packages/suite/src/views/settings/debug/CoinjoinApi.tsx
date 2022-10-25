import React from 'react';
import styled from 'styled-components';

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

    const handleChange = (item: { value: CoinjoinServerEnvironment }) => {
        setDebugMode({
            coinjoinRegtestServerEnvironment: item.value,
        });
    };

    return (
        <SectionItem data-test="@settings/debug/coinjoin-api">
            <TextColumn title="Coinjoin" description="Coinjoin Regtest server" />
            <ActionColumn>
                <StyledActionSelect
                    onChange={handleChange}
                    value={selectedOption}
                    options={options}
                    data-test="@settings/coinjoin-server-select"
                />
            </ActionColumn>
        </SectionItem>
    );
};
