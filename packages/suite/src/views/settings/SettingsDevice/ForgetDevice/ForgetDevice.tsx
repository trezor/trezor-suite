import { useState } from 'react';

import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import * as deviceUtils from '@suite-common/suite-utils';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

import { ForgetDeviceModal } from './ForgetDeviceModal';

export const ForgetDevice = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const selectedDevice = useSelector(selectSelectedDevice);
    const hasRunningDiscovery = useSelector(selectHasRunningDiscovery);

    if (!selectedDevice || !deviceUtils.isDeviceAcquired(selectedDevice)) {
        return null;
    }

    const handleClick = () => setIsModalOpen(true);
    const handleModalCancel = () => setIsModalOpen(false);

    return (
        <>
            {isModalOpen && <ForgetDeviceModal onCancel={handleModalCancel} />}
            <SectionItem data-testid="@settings/device/forget">
                <TextColumn
                    title={<Translation id="TR_FORGET_DEVICE_HEADING" />}
                    description={<Translation id="TR_FORGET_DEVICE_DESCRIPTION" />}
                />
                <ActionColumn>
                    <ActionButton
                        data-testid="@settings/device/forget-button"
                        onClick={handleClick}
                        intent="warning"
                        isDisabled={hasRunningDiscovery}
                    >
                        <Translation id="TR_FORGET" />
                    </ActionButton>
                </ActionColumn>
            </SectionItem>
        </>
    );
};
