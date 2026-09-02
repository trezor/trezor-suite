import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { LearnMoreButton } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { selectIsTorEnabled, selectIsTorEnabling, selectIsTorLoading } from '@suite/tor';
import { useDispatch } from '@suite-common/redux-utils';
import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { HELP_CENTER_TOR_URL } from '@trezor/urls';

import { toggleTorThunk } from '../toggleTorThunk';

type TorProps = {
    // Called before Tor is switched off. Resolve `true` to keep Tor running (abort the toggle) —
    // e.g. when disabling would stop an active coinjoin and the user cancels. Resolve `false` to proceed.
    onBeforeDisable?: () => Promise<boolean>;
};

export const Tor = ({ onBeforeDisable }: TorProps) => {
    const [hasTorError, setHasTorError] = useState(false);
    const isTorEnabled = useSelector(selectIsTorEnabled);
    const isTorLoading = useSelector(selectIsTorLoading);
    const isTorEnabling = useSelector(selectIsTorEnabling);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!hasTorError) {
            return;
        }

        const timeout = setTimeout(() => setHasTorError(false), 1000);

        return () => clearTimeout(timeout);
    }, [hasTorError]);

    const handleTorSwitch = async () => {
        if (isTorEnabled && (await onBeforeDisable?.())) {
            return;
        }
        const shouldEnableTor = !isTorEnabled && !isTorLoading;
        try {
            await dispatch(toggleTorThunk(shouldEnableTor));
        } catch {
            setHasTorError(true);
        }
    };

    return (
        <Anchor anchorId={SettingsAnchor.Tor}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
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
                        bottomContent={<LearnMoreButton url={HELP_CENTER_TOR_URL} />}
                    />
                    <ActionColumn>
                        <Switch
                            data-testid="@settings/general/tor-switch"
                            isChecked={isTorEnabled || isTorEnabling}
                            onChange={handleTorSwitch}
                        />
                    </ActionColumn>
                </SectionItem>
            )}
        </Anchor>
    );
};
