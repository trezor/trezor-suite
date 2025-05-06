import { useEffect, useState } from 'react';

import { Switch } from '@trezor/components';
import { HELP_CENTER_TOR_URL } from '@trezor/urls';

import { openDeferredModal } from 'src/actions/suite/modalActions';
import { toggleTor } from 'src/actions/suite/suiteActions';
import { SettingsSectionItem } from 'src/components/settings';
import { ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectModalType } from 'src/reducers/suite/modalReducer';
import { selectCoinjoinAccounts } from 'src/reducers/wallet/coinjoinReducer';
import { TorStatus } from 'src/types/suite';
import { getIsTorEnabled, getIsTorLoading } from 'src/utils/suite/tor';

export const Tor = () => {
    const [hasTorError, setHasTorError] = useState(false);
    const coinjoinAccounts = useSelector((state: any) => selectCoinjoinAccounts(state));
    const isCoinjoinAccount = coinjoinAccounts.length > 0;
    const torStatus = useSelector(state => state.suite.torStatus);
    const modalType = useSelector(selectModalType);
    const dispatch = useDispatch();

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
            const isKeepRunningTor = await dispatch(
                openDeferredModal({
                    type: 'disable-tor-stop-coinjoin',
                }),
            );
            if (isKeepRunningTor) {
                return;
            }
        }
        const shouldEnableTor = !isTorEnabled && !isTorLoading;
        try {
            await dispatch(toggleTor(shouldEnableTor, modalType));
        } catch {
            setHasTorError(true);
        }
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.Tor}>
            <TextColumn
                title={<Translation id="TR_TOR_TITLE" />}
                description={
                    <Translation
                        id="TR_TOR_DESCRIPTION"
                        values={{
                            lineBreak: <br />,
                        }}
                    />
                }
                buttonLink={HELP_CENTER_TOR_URL}
            />
            <ActionColumn>
                <Switch
                    data-testid="@settings/general/tor-switch"
                    isChecked={isTorEnabled || torStatus === TorStatus.Enabling}
                    onChange={handleTorSwitch}
                />
            </ActionColumn>
        </SettingsSectionItem>
    );
};
