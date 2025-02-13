import { Checkbox } from '@trezor/components';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { initBluetoothThunk } from '../../../actions/bluetooth/initBluetoothThunk';
import { setFlag } from '../../../actions/suite/suiteActions';
import { selectSuiteFlags } from '../../../reducers/suite/suiteReducer';

export const Bluetooth = () => {
    const { isBluetoothEnabled } = useSelector(selectSuiteFlags);
    const dispatch = useDispatch();

    return (
        <SectionItem>
            <TextColumn title="Bluetooth enabled" />
            <ActionColumn>
                <Checkbox
                    isChecked={isBluetoothEnabled}
                    onClick={async () => {
                        dispatch(setFlag('isBluetoothEnabled', !isBluetoothEnabled));
                        await dispatch(initBluetoothThunk());
                    }}
                />
            </ActionColumn>
        </SectionItem>
    );
};
