import { useState } from 'react';

import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { ChangeServerModal } from '@suite/suite-sync';
import { type SuiteSync } from '@suite-common/suite-sync-types';
import { ActionButton, ActionColumn, TextColumn } from '@trezor/product-components';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';

type LabelingServersProps = {
    suiteSync: SuiteSync;
};

export const LabelingServers = ({ suiteSync }: LabelingServersProps) => {
    const [showChangeServerModal, setShowChangeServerModal] = useState(false);

    const toggleChangeServerModal = () => {
        setShowChangeServerModal(!showChangeServerModal);
    };

    return (
        <>
            {showChangeServerModal && (
                <ChangeServerModal suiteSync={suiteSync} onCancel={toggleChangeServerModal} />
            )}
            <SettingsSectionItem anchorId={SettingsAnchor.LabelingServers}>
                <TextColumn
                    title={<Translation id="TR_LABELING_SYNCED_THROUGH_TREZOR_SERVERS" />}
                    description={<Translation id="TR_LABELING_SERVERS_DESCRIPTION" />}
                />
                <ActionColumn>
                    <ActionButton
                        intent="brand"
                        onClick={toggleChangeServerModal}
                        data-testid="@settings/labeling-servers-change"
                    >
                        <Translation id="TR_LABELING_SERVERS_CHANGE" />
                    </ActionButton>
                </ActionColumn>
            </SettingsSectionItem>
        </>
    );
};
