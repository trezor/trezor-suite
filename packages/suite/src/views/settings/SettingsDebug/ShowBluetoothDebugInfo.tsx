import { selectFlags, setFlag } from '@suite/flags';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { Checkbox } from '@trezor/components';
import { SectionItem } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

export const ShowBluetoothDebugInfo = () => {
    const { showBluetoothDebugInfo } = useSelector(selectFlags);
    const { dispatch } = useServices(injectDispatch);

    const handleOnClick = () => {
        dispatch(setFlag({ key: 'showBluetoothDebugInfo', value: !showBluetoothDebugInfo }));
    };

    return (
        <SectionItem
            title="Show Bluetooth Debug Info"
            actions={<Checkbox isChecked={showBluetoothDebugInfo} onChange={handleOnClick} />}
        />
    );
};
