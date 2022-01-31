import React, { useCallback, useEffect, useState } from 'react';

import { Translation } from '@suite-components';
import { ActionColumn, ActionInput, SectionItem, TextColumn } from '@suite-components/Settings';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

// Default address of the bundled tor process.
// Keep in sync with DEFAULT_ADDRESS in suite-desktop's TorProcess.
const DEFAULT_ADDRESS = '127.0.0.1:9050';

export const TorAddress = () => {
    const [torAddress, setTorAddress] = useState<string>('');
    useEffect(() => {
        window.desktopApi?.getTorAddress().then(address => setTorAddress(address));
    }, [setTorAddress]);
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.TorAddress);

    const saveTorAddress = useCallback(() => {
        // TODO: Validation
        // Let the user go back to default by clearing the input.
        // Indicate this to the user by using DEFAULT_ADDRESS as placeholder in the input below.
        const address = torAddress.length > 0 ? torAddress : DEFAULT_ADDRESS;
        window.desktopApi!.setTorAddress(address);
    }, [torAddress]);

    return (
        <SectionItem
            data-test="@settings/tor-address"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_TOR_PARAM_TITLE" />}
                description={<Translation id="TR_TOR_PARAM_DESCRIPTION" />}
            />
            <ActionColumn>
                <ActionInput
                    noTopLabel
                    noError
                    value={torAddress}
                    state={/* (TODO: Error check) ? 'error' : */ undefined}
                    onChange={(event: React.FormEvent<HTMLInputElement>) =>
                        setTorAddress(event.currentTarget.value)
                    }
                    onBlur={saveTorAddress}
                    data-test="@settings/general/tor-address"
                    placeholder={DEFAULT_ADDRESS}
                />
            </ActionColumn>
        </SectionItem>
    );
};
