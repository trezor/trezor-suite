import React, { useState } from 'react';

import { Button } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useFirmware } from '@suite-hooks';

export const CheckFirmwareAuthenticity = () => {
    const [inProgress, setInProgress] = useState(false);

    const { checkFirmwareAuthenticity } = useFirmware();

    const onCheck = async () => {
        setInProgress(true);
        await checkFirmwareAuthenticity();
        setInProgress(false);
    };

    return (
        <SectionItem data-test="@settings/debug/check-firmware-authenticity">
            <TextColumn
                title="Check firmware authenticity"
                description="Download firmware binary from data.trezor.io and compare its hash with firmware hash provided by Trezor device."
            />
            <ActionColumn>
                <Button onClick={onCheck} isLoading={inProgress} isDisabled={inProgress}>
                    Check
                </Button>
            </ActionColumn>
        </SectionItem>
    );
};
