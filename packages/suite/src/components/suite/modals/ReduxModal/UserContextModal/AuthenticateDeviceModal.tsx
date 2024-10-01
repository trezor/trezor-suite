import { useState } from 'react';

import { checkDeviceAuthenticityThunk } from '@suite-common/device-authenticity';
import { NewModal, List, IconName, Paragraph, Icon } from '@trezor/components';
import { selectSelectedDeviceAuthenticity } from '@suite-common/wallet-core';
import { TranslationKey } from '@suite-common/intl-types';
import { spacings } from '@trezor/theme';

import { onCancel, openModal } from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

const items: Array<{ icon: IconName; text: TranslationKey }> = [
    { icon: 'shieldCheck', text: 'TR_DEVICE_AUTHENTICITY_ITEM_1' },
    { icon: 'chip', text: 'TR_DEVICE_AUTHENTICITY_ITEM_2' },
    { icon: 'checklist', text: 'TR_DEVICE_AUTHENTICITY_ITEM_3' },
];

export const AuthenticateDeviceModal = () => {
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const selectedDeviceAuthenticity = useSelector(selectSelectedDeviceAuthenticity);

    const handleClick = async () => {
        setIsLoading(true);

        await dispatch(checkDeviceAuthenticityThunk({ allowDebugKeys: isDebugModeActive }));

        setIsLoading(false);

        if (selectedDeviceAuthenticity?.valid === false) {
            dispatch(openModal({ type: 'authenticate-device-fail' }));
        }
    };

    const handleClose = () => dispatch(onCancel());

    return (
        <NewModal
            onCancel={handleClose}
            heading={<Translation id="TR_LETS_CHECK_YOUR_DEVICE" />}
            bottomContent={
                <>
                    <NewModal.Button
                        onClick={handleClick}
                        isDisabled={isLoading}
                        isLoading={isLoading}
                    >
                        <Translation id="TR_START_CHECK" />
                    </NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={handleClose}>
                        <Translation id="TR_CANCEL" />
                    </NewModal.Button>
                </>
            }
        >
            <List
                gap={spacings.xl}
                bulletGap={spacings.xl}
                margin={{ top: spacings.xs, bottom: spacings.sm }}
            >
                {items.map(({ icon, text }) => (
                    <List.Item
                        key={icon}
                        bulletComponent={<Icon name={icon} size="extraLarge" variant="primary" />}
                    >
                        <Paragraph variant="tertiary">
                            <Translation id={text} />
                        </Paragraph>
                    </List.Item>
                ))}
            </List>
        </NewModal>
    );
};
