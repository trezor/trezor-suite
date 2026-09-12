import { useCallback, useEffect, useState } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { selectDesktopApiDep } from '@trezor/suite-desktop-api';

const PositionedSwitch = styled.div`
    align-self: center;
`;

export const AutoStart = () => {
    const { desktopApi } = useServices(selectDesktopApiDep);
    const [autoStartEnabled, setAutoStartEnabled] = useState(false);

    const updateAutoStartStatus = useCallback(() => {
        desktopApi.getAppAutoStartIsEnabled().then(result => {
            if (result.success) {
                setAutoStartEnabled(result.payload);
            }
        });
    }, [desktopApi]);
    // set initial state based on real electron settings
    useEffect(() => {
        updateAutoStartStatus();
    }, [updateAutoStartStatus]);

    const handleChange = (enabled: boolean) => {
        desktopApi.appAutoStart(enabled);
        Promise.resolve().then(() => updateAutoStartStatus());
    };

    return (
        <Anchor anchorId={SettingsAnchor.AutoStart}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
                    <TextColumn
                        title={<Translation id="TR_AUTO_START" />}
                        description={<Translation id="TR_AUTO_START_DESCRIPTION" />}
                    />
                    <ActionColumn>
                        <PositionedSwitch>
                            <Switch
                                data-testid="@autostart/toggle-switch"
                                isChecked={!!autoStartEnabled}
                                onChange={() => handleChange(!autoStartEnabled)}
                            />
                        </PositionedSwitch>
                    </ActionColumn>
                </SectionItem>
            )}
        </Anchor>
    );
};
