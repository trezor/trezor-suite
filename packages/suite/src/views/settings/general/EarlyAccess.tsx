import React, { useCallback } from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useAnalytics, useSelector, useActions } from '@suite-hooks';
import * as desktopUpdateActions from '@suite-actions/desktopUpdateActions';

const Version = styled.div`
    span {
        display: flex;
        align-items: center;
    }
`;

export const EarlyAccess = () => {
    const analytics = useAnalytics();

    const { desktopUpdate } = useSelector(state => ({
        desktopUpdate: state.desktopUpdate,
    }));

    const { openEarlyAccessSetup } = useActions({
        openEarlyAccessSetup: desktopUpdateActions.openEarlyAccessSetup,
    });

    const setupEarlyAccess = useCallback(() => {
        analytics.report({
            type: 'settings/general/goto/early-access',
            payload: {
                allowPrerelease: desktopUpdate.allowPrerelease,
            },
        });
        openEarlyAccessSetup(desktopUpdate.allowPrerelease);
        window.desktopApi?.cancelUpdate(); // stop downloading the update if it is in progress to prevent confusing state switching
    }, [analytics, openEarlyAccessSetup, desktopUpdate.allowPrerelease]);

    return (
        <SectionItem data-test="@settings/early-access">
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
