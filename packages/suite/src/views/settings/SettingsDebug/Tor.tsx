import { toggleTor } from '@suite/tor-desktop';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch } from 'src/hooks/suite';

export const Tor = () => {
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
                            dispatch(toggleTor(false));
                        }}
                    >
                        Stop Tor
                    </ActionButton>
                </ActionColumn>
            </SectionItem>
        </>
    );
};
