import React from 'react';

import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useSelector, useDispatch } from '@suite-hooks';
import { toggleUseDevkit } from '@firmware-actions/firmwareActions';

export const Devkit = () => {
    const dispatch = useDispatch();
    const useDevkit = useSelector(state => state.firmware.useDevkit);

    const onChangeRegularCheck = () => {
        dispatch(toggleUseDevkit(!useDevkit));
    };

    return (
        <SectionItem data-test="@settings/debug/firmware-devkit/switch">
            <TextColumn
                title="Devkit"
                description="Offer devkit versions of firmware binaries. Never install regular firmware on devkit and vice versa! Use this only if you know what you are doing."
            />
            <ActionColumn>
                <Switch onChange={onChangeRegularCheck} isChecked={useDevkit} />
            </ActionColumn>
        </SectionItem>
    );
};
