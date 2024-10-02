import { useState } from 'react';

import { Button } from '@trezor/components';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { manualFirmwareHashCheckThunk } from '@suite-common/wallet-core';

export const CheckFirmwareAuthenticity = () => {
    const [inProgress, setInProgress] = useState(false);

    const dispatch = useDispatch();

    const onCheckFirmwareAuthenticity = async () => {
        setInProgress(true);
        await dispatch(manualFirmwareHashCheckThunk());
        setInProgress(false);
    };

    return (
        <SectionItem data-testid="@settings/debug/check-firmware-authenticity">
            <TextColumn
                title="Check firmware authenticity"
                description="Download firmware binary from data.trezor.io and compare its hash with firmware hash provided by Trezor device. TODO will be removed and done automatically"
            />
            <ActionColumn>
                <Button
                    onClick={onCheckFirmwareAuthenticity}
                    isLoading={inProgress}
                    isDisabled={inProgress}
                >
                    Check
                </Button>
            </ActionColumn>
        </SectionItem>
    );
};
