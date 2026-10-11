import { selectFlags, setFlag } from '@suite/flags';
import { Checkbox } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';

export const ShowBluetoothDebugInfo = () => {
    const { showBluetoothDebugInfo } = useSelector(selectFlags);
    const { dispatch } = useServices(injectDispatch);

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
