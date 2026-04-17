import styled from 'styled-components';

import { selectDesktopUpdateEnabled } from '@suite/desktop-update';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { useSelector } from 'src/hooks/suite';

const PositionedSwitch = styled.div`
    align-self: center;
`;

export const AutomaticUpdate = () => {
    const isUpdateEnabled = useSelector(selectDesktopUpdateEnabled);
    const isAutomaticUpdateEnabled = useSelector(
        state => state.desktopUpdate.isAutomaticUpdateEnabled,
    );

    if (!isUpdateEnabled) {
        return null;
    }

    const handleChange = () => {
        const newValue = !isAutomaticUpdateEnabled;

        desktopApi.setAutomaticUpdateEnabled(newValue);
    };

    return (
        <Anchor anchorId={SettingsAnchor.AutomaticUpdate}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
                    <TextColumn
                        title={<Translation id="TR_ALLOW_AUTOMATIC_SUITE_UPDATES" />}
                        description={
                            <Translation id="TR_ALLOW_AUTOMATIC_SUITE_UPDATES_DESCRIPTION" />
                        }
                    />
                    <ActionColumn>
                        <PositionedSwitch>
                            <Switch
                                data-testid="@isAutomaticUpdateEnabled-update/toggle-switch"
                                isChecked={isAutomaticUpdateEnabled}
                                onChange={handleChange}
                            />
                        </PositionedSwitch>
                    </ActionColumn>
                </SectionItem>
            )}
        </Anchor>
    );
};
