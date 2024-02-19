import { useEffect, useState } from 'react';
import { LoadingContent, Switch } from '@trezor/components';
import { TOR_PROJECT_URL } from '@trezor/urls';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { toggleTor } from 'src/actions/suite/suiteActions';
import { ActionColumn, SectionItem, TextColumn, Translation } from 'src/components/suite';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { getIsTorEnabled, getIsTorLoading } from 'src/utils/suite/tor';
import { TorStatus } from 'src/types/suite';
import { openDeferredModal } from 'src/actions/suite/modalActions';
import { selectCoinjoinAccounts } from 'src/reducers/wallet/coinjoinReducer';

export const Tor = () => {
    const [hasTorError, setHasTorError] = useState(false);
    const coinjoinAccounts = useSelector((state: any) => selectCoinjoinAccounts(state));
    const isCoinjoinAccount = coinjoinAccounts.length > 0;
    const torStatus = useSelector(state => state.suite.torStatus);
    const dispatch = useDispatch();
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
            const isKeepRunningTor = await dispatch(
                openDeferredModal({
                    type: 'disable-tor-stop-coinjoin',
                }),
            );
            if (isKeepRunningTor) {
                return;
            }
        }
        try {
            await dispatch(toggleTor(!isTorEnabled));
        } catch {
            setHasTorError(true);
        }
    };

    return (
        <SectionItem data-test-id="@settings/tor" ref={anchorRef} shouldHighlight={shouldHighlight}>
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
