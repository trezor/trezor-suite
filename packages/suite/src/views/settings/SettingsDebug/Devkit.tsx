import { firmwareActions, selectUseDevkit } from '@suite-common/wallet-core';
import { Switch } from '@trezor/components';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useSelector, useDispatch } from 'src/hooks/suite';

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
