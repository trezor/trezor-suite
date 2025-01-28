import { toggleTor } from 'src/actions/suite/suiteActions';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
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
                        variant="destructive"
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
