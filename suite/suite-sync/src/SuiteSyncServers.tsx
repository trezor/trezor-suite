import { useState } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectSuiteSyncCustomRelayUrl } from '@suite-common/suite-sync';
import { type SuiteSync } from '@suite-common/suite-sync-types';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { SelectSuiteSyncServer } from './SelectSuiteSyncServer';

type SuiteSyncServersProps = {
    suiteSync: SuiteSync;
};

export const SuiteSyncServers = ({ suiteSync }: SuiteSyncServersProps) => {
    const [isSelectServerOpen, setShowChangeServerModal] = useState(false);
    const customRelayUrl = useSelector(selectSuiteSyncCustomRelayUrl);
    const isCustomServer = !!customRelayUrl;

    const toggleSelectServer = () => {
        setShowChangeServerModal(!isSelectServerOpen);
    };

    return (
        <>
            {isSelectServerOpen && (
                <SelectSuiteSyncServer suiteSync={suiteSync} onCancel={toggleSelectServer} />
            )}
            <SectionItem data-testid="@settings/labeling-servers">
                <TextColumn
                    title={
                        <Translation
                            id={
                                isCustomServer
                                    ? 'TR_LABELING_SYNCED_THROUGH_CUSTOM_SERVER'
                                    : 'TR_LABELING_SYNCED_THROUGH_TREZOR_SERVERS'
                            }
                        />
                    }
                    description={<Translation id="TR_LABELING_SERVERS_DESCRIPTION" />}
                />
                <ActionColumn>
                    <ActionButton
                        intent="brand"
                        onClick={toggleSelectServer}
                        data-testid="@settings/labeling-servers-change"
                    >
                        <Translation id="TR_LABELING_SERVERS_CHANGE" />
                    </ActionButton>
                </ActionColumn>
            </SectionItem>
        </>
    );
};
