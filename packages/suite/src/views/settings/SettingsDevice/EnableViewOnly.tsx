import { goto } from 'src/actions/suite/routerActions';
import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

export const EnableViewOnly = () => {
    const dispatch = useDispatch();
    const handleSwitchDeviceClick = () =>
        dispatch(
            goto('suite-switch-device', {
                params: {
                    cancelable: true,
                },
            }),
        );

    return (
        <SectionItem data-test="@settings/device/enable-view-only">
            <TextColumn
                title={<Translation id="TR_DEVICE_SETTINGS_ENABLE_VIEW_ONLY_TITLE" />}
                description={<Translation id="TR_DEVICE_SETTINGS_ENABLE_VIEW_ONLY_DESC" />}
            />
            <ActionColumn>
                <ActionButton onClick={handleSwitchDeviceClick} variant="secondary">
                    <Translation id="TR_DEVICE_SETTINGS_ENABLE_VIEW_ONLY_CHANGE_BUTTON" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
