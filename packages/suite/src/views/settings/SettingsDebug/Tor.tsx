import { toggleTorThunk } from '@suite/tor-desktop';
import { useServices } from '@trezor/dependency-injection';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

export const Tor = () => {
    const { dispatch } = useServices(injectDispatch);

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
                            dispatch(toggleTorThunk(false));
                        }}
                    >
                        Stop Tor
                    </ActionButton>
                </ActionColumn>
            </SectionItem>
        </>
    );
};
