import { Checkbox } from '@trezor/components';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSuiteFlags } from 'src/selectors/suite/suiteSelectors';

import { setFlag } from '../../../actions/suite/suiteActions';

export const ShowBluetoothDebugInfo = () => {
    const { isBluetoothEnabled, showBluetoothDebugInfo } = useSelector(selectSuiteFlags);
    const dispatch = useDispatch();

    const handleOnClick = () => {
        dispatch(setFlag('showBluetoothDebugInfo', !showBluetoothDebugInfo));
    };

    return (
        isBluetoothEnabled && (
            <SectionItem>
                <TextColumn title="Show Bluetooth Debug Info" />
                <ActionColumn>
                    <Checkbox isChecked={showBluetoothDebugInfo} onClick={handleOnClick} />
                </ActionColumn>
            </SectionItem>
        )
    );
};
