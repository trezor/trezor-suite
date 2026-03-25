import { useState } from 'react';

import { Translation } from '@suite/intl';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { HELP_CENTER_DEVICE_AUTHENTICATION } from '@trezor/urls';

import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';

import { AuthenticateDeviceModal } from './AuthenticateDevice/AuthenticateDeviceModal';

interface AuthenticateDeviceProps {
    isDeviceLocked: boolean;
}

export const AuthenticateDevice = ({ isDeviceLocked }: AuthenticateDeviceProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleClick = () => setIsModalOpen(true);

    return (
        <>
            {isModalOpen && <AuthenticateDeviceModal handleClose={() => setIsModalOpen(false)} />}
            <SectionItem>
                <TextColumn
                    title={<Translation id="TR_CHECK_DEVICE_ORIGIN_TITLE" />}
                    description={<Translation id="TR_CHECK_DEVICE_ORIGIN_DESCRIPTION" />}
                    learnMoreButton={<LearnMoreButton url={HELP_CENTER_DEVICE_AUTHENTICATION} />}
                />
                <ActionColumn>
                    <ActionButton
                        intent="brand"
                        onClick={handleClick}
                        isDisabled={isDeviceLocked}
                        isTooltipActive={isDeviceLocked}
                        tooltipContent={
                            <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                        }
                    >
                        <Translation id="TR_CHECK_ORIGIN" />
                    </ActionButton>
                </ActionColumn>
            </SectionItem>
        </>
    );
};
