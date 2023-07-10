import React from 'react';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { useSelector, useDispatch } from 'src/hooks/suite';
import { firmwareActions } from 'src/actions/firmware/firmwareActions';
import { selectUseDevkit } from 'src/reducers/firmware/firmwareReducer';

import { Switch } from '@trezor/components';

export const Devkit = () => {
    const dispatch = useDispatch();
    const useDevkit = useSelector(selectUseDevkit);

    const onChangeRegularCheck = () => {
        dispatch(firmwareActions.toggleUseDevkit(!useDevkit));
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
