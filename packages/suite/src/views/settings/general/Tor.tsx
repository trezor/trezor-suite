import React, { useEffect, useState } from 'react';
import { LoadingContent, Switch } from '@trezor/components';
import { TOR_PROJECT_URL } from '@trezor/urls';
import { useSelector, useActions } from '@suite-hooks';
import { ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import * as suiteActions from '@suite-actions/suiteActions';
import { Translation } from '@suite-components';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';
import { getIsTorEnabled, getIsTorLoading } from '@suite-utils/tor';
import { TorStatus } from '@suite-types';

export const Tor = () => {
    const torStatus = useSelector(state => state.suite.torStatus);

    const [hasTorError, setHasTorError] = useState(false);

    const { toggleTor } = useActions({
        toggleTor: suiteActions.toggleTor,
    });

    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Tor);

    useEffect(() => {
        if (hasTorError) {
            setTimeout(() => setHasTorError(false), 1000);
        }
    }, [hasTorError]);

    const isTorEnabled = getIsTorEnabled(torStatus);
    const isTorLoading = getIsTorLoading(torStatus);

    const handleTorSwitch = async () => {
        try {
            await toggleTor(!isTorEnabled);
        } catch {
            setHasTorError(true);
        }
    };

    return (
        <SectionItem data-test="@settings/tor" ref={anchorRef} shouldHighlight={shouldHighlight}>
            <TextColumn
                title={
                    <LoadingContent isLoading={isTorLoading} isSuccessful={!hasTorError}>
                        <Translation id="TR_TOR_TITLE" />
                    </LoadingContent>
                }
                description={
                    <Translation
                        id="TR_TOR_DESCRIPTION"
                        values={{
                            lineBreak: <br />,
                        }}
                    />
                }
                buttonLink={TOR_PROJECT_URL}
            />
            <ActionColumn>
                <Switch
                    dataTest="@settings/general/tor-switch"
                    isChecked={isTorEnabled || torStatus === TorStatus.Enabling}
                    isDisabled={isTorLoading}
                    onChange={handleTorSwitch}
                />
            </ActionColumn>
        </SectionItem>
    );
};
