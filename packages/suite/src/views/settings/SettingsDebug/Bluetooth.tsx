import { useState } from 'react';

import { Checkbox } from '@trezor/components';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSuiteFlags } from 'src/selectors/suite/suiteSelectors';

import { disposeBluetoothThunk } from '../../../actions/bluetooth/disposeBluetoothThunk';
import { initBluetoothThunk } from '../../../actions/bluetooth/initBluetoothThunk';
import { setFlag } from '../../../actions/suite/suiteActions';

export const Bluetooth = () => {
    const { isBluetoothEnabled } = useSelector(selectSuiteFlags);
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const handleOnClick = async () => {
        setIsLoading(true);

        dispatch(setFlag('isBluetoothEnabled', !isBluetoothEnabled));

        if (isBluetoothEnabled) {
            await dispatch(disposeBluetoothThunk());
        } else {
            await dispatch(initBluetoothThunk());
        }

        setIsLoading(false);
    };

    return (
        <SectionItem>
            <TextColumn title="Bluetooth enabled" />
            <ActionColumn>
                <Checkbox
                    isDisabled={isLoading}
                    isChecked={isBluetoothEnabled}
                    onClick={handleOnClick}
                />
            </ActionColumn>
        </SectionItem>
    );
};
