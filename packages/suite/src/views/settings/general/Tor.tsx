import React, { useEffect, useState } from 'react';
import { LoadingContent, Switch } from '@trezor/components';
import { TOR_PROJECT_URL } from '@trezor/urls';
import { useSelector, useActions } from 'src/hooks/suite';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';
import * as suiteActions from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { getIsTorEnabled, getIsTorLoading } from 'src/utils/suite/tor';
import { Dispatch, TorStatus } from 'src/types/suite';

import * as modalActions from 'src/actions/suite/modalActions';
import { selectCoinjoinAccounts } from 'src/reducers/wallet/coinjoinReducer';

const disableTorStopCoinjoinAction = () => (dispatch: Dispatch) =>
    dispatch(
        modalActions.openDeferredModal({
            type: 'disable-tor-stop-coinjoin',
        }),
    );

export const Tor = () => {
    const coinjoinAccounts = useSelector((state: any) => selectCoinjoinAccounts(state));
    const isCoinjoinAccount = coinjoinAccounts.length > 0;
    const torStatus = useSelector(state => state.suite.torStatus);

    const [hasTorError, setHasTorError] = useState(false);

    const { toggleTor, disableTorStopCoinjoin } = useActions({
        toggleTor: suiteActions.toggleTor,
        disableTorStopCoinjoin: disableTorStopCoinjoinAction,
    });

    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.Tor);

    useEffect(() => {
        if (!hasTorError) {
            return;
        }

        const timeout = setTimeout(() => setHasTorError(false), 1000);

        return () => clearTimeout(timeout);
    }, [hasTorError]);

    const isTorEnabled = getIsTorEnabled(torStatus);
    const isTorLoading = getIsTorLoading(torStatus);

    const handleTorSwitch = async () => {
        if (isTorEnabled && isCoinjoinAccount) {
            // Let the user know that stopping Tor will stop coinjoin.
            const isKeepRunningTor = await disableTorStopCoinjoin();
            if (isKeepRunningTor) {
                return;
            }
        }
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
