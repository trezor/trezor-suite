import { toggleTorThunk } from '@suite/tor-desktop';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { SectionItem } from '@trezor/product-components';

export const Tor = () => {
    const { dispatch } = useServices(injectDispatch);

    return (
        <>
            <SectionItem
                data-test="@settings/debug/tor/stop"
                title="Stop Tor"
                description="This debug setting allows you to stop Tor when it is still bootstrapping."
                actions={
                    <SectionItem.Button
                        intent="critical"
                        onClick={() => {
                            dispatch(toggleTorThunk(false));
                        }}
                    >
                        Stop Tor
                    </SectionItem.Button>
                }
            />
        </>
    );
};
