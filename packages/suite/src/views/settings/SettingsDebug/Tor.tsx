import { selectModalType } from '@suite/modal';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { toggleTor } from 'src/actions/suite/suiteActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const Tor = () => {
    const modalType = useSelector(selectModalType);
    const dispatch = useDispatch();

    return (
        <>
            <SectionItem data-test="@settings/debug/tor/stop">
                <TextColumn
                    title="Stop Tor"
                    description="This debug setting allows you to stop Tor when it is still bootstrapping."
                />
                <ActionColumn>
                    <ActionButton
                        intent="critical"
                        onClick={() => {
                            dispatch(toggleTor(false, modalType));
                        }}
                    >
                        Stop Tor
                    </ActionButton>
                </ActionColumn>
            </SectionItem>
        </>
    );
};
