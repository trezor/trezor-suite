import { HELP_CENTER_DEVICE_AUTHENTICATION } from '@trezor/urls';

import { openModal } from 'src/actions/suite/modalActions';
import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

interface AuthenticateDeviceProps {
    isDeviceLocked: boolean;
}

export const AuthenticateDevice = ({ isDeviceLocked }: AuthenticateDeviceProps) => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(openModal({ type: 'authenticate-device' }));

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_CHECK_DEVICE_ORIGIN_TITLE" />}
                description={<Translation id="TR_CHECK_DEVICE_ORIGIN_DESCRIPTION" />}
                buttonLink={HELP_CENTER_DEVICE_AUTHENTICATION}
            />
            <ActionColumn>
                <ActionButton
                    variant="primary"
                    onClick={handleClick}
                    isDisabled={isDeviceLocked}
                    isTooltipActive={isDeviceLocked}
                    tooltipContent={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                >
                    <Translation id="TR_CHECK_ORIGIN" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
