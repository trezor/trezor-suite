import React, { useCallback } from 'react';
import styled from 'styled-components';

import { desktopApi } from '@trezor/suite-desktop-api';
import { Translation } from 'src/components/suite';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { useSelector, useActions } from 'src/hooks/suite';
import * as desktopUpdateActions from 'src/actions/suite/desktopUpdateActions';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

const Version = styled.div`
    span {
        display: flex;
        align-items: center;
    }
`;

export const EarlyAccess = () => {
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.EarlyAccess);

    const desktopUpdate = useSelector(state => state.desktopUpdate);

    const { openEarlyAccessSetup } = useActions({
        openEarlyAccessSetup: desktopUpdateActions.openEarlyAccessSetup,
    });

    const setupEarlyAccess = useCallback(() => {
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
