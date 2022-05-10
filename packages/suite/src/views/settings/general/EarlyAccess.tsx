import React, { useCallback } from 'react';
import styled from 'styled-components';
import { analytics, EventType } from '@trezor/suite-analytics';

import { desktopApi } from '@trezor/suite-desktop-api';
import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useSelector, useActions } from '@suite-hooks';
import * as desktopUpdateActions from '@suite-actions/desktopUpdateActions';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

const Version = styled.div`
    span {
        display: flex;
        align-items: center;
    }
`;

export const EarlyAccess = () => {
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.EarlyAccess);

    const { desktopUpdate } = useSelector(state => ({
        desktopUpdate: state.desktopUpdate,
    }));

    const { openEarlyAccessSetup } = useActions({
        openEarlyAccessSetup: desktopUpdateActions.openEarlyAccessSetup,
    });

    const setupEarlyAccess = useCallback(() => {
        analytics.report({
            type: EventType.SettingsGeneralGotoEarlyAccess,
            payload: {
                allowPrerelease: desktopUpdate.allowPrerelease,
            },
        });
        openEarlyAccessSetup(desktopUpdate.allowPrerelease);
        desktopApi.cancelUpdate(); // stop downloading the update if it is in progress to prevent confusing state switching
    }, [openEarlyAccessSetup, desktopUpdate.allowPrerelease]);

    return (
        <SectionItem
            data-test="@settings/early-access"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={
                    <Translation
                        id={
                            desktopUpdate.allowPrerelease
                                ? 'TR_EARLY_ACCESS_ENABLED'
                                : 'TR_EARLY_ACCESS'
                        }
                    />
                }
                description={
                    <Version>
                        <Translation
                            id={
                                desktopUpdate.allowPrerelease
                                    ? 'TR_EARLY_ACCESS_DESCRIPTION_ENABLED'
                                    : 'TR_EARLY_ACCESS_DESCRIPTION'
                            }
                        />
                    </Version>
                }
            />
            <ActionColumn>
                <ActionButton onClick={setupEarlyAccess} variant="secondary">
                    <Translation
                        id={
                            desktopUpdate.allowPrerelease
                                ? 'TR_EARLY_ACCESS_DISABLE'
                                : 'TR_EARLY_ACCESS_ENABLE'
                        }
                    />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
