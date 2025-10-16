import { Column, NewButton } from '@trezor/components';

import { toggleConnectionModal } from 'src/actions/device/deviceSlice';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch } from 'src/hooks/suite';

export const DeviceConnect = () => {
    const dispatch = useDispatch();

    return (
        <Column alignItems="center" margin={{ bottom: 40 }}>
            <NewButton
                minWidth={240}
                size="large"
                onClick={() => dispatch(toggleConnectionModal())}
            >
                <Translation id="TR_CONNECT" />
            </NewButton>
        </Column>
    );
};
