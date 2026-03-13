import { selectFlags, setFlag } from '@suite/flags';
import { Checkbox } from '@trezor/components';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const ShowBluetoothDebugInfo = () => {
    const { showBluetoothDebugInfo } = useSelector(selectFlags);
    const dispatch = useDispatch();

    const handleOnClick = () => {
        dispatch(setFlag({ key: 'showBluetoothDebugInfo', value: !showBluetoothDebugInfo }));
    };

    return (
        <SectionItem>
            <TextColumn title="Show Bluetooth Debug Info" />
            <ActionColumn>
                <Checkbox isChecked={showBluetoothDebugInfo} onChange={handleOnClick} />
            </ActionColumn>
        </SectionItem>
    );
};
