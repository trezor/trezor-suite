import { useState } from 'react';

import { checkDeviceAuthenticityThunk } from '@suite-common/device-authenticity';
import { TranslationKey } from '@suite-common/intl-types';
import { Icon, IconName, List, Modal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { onCancel, openModal } from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

const items: Array<{ icon: IconName; text: TranslationKey }> = [
    { icon: 'shieldCheck', text: 'TR_DEVICE_AUTHENTICITY_ITEM_1' },
    { icon: 'cpu', text: 'TR_DEVICE_AUTHENTICITY_ITEM_2' },
    { icon: 'listChecks', text: 'TR_DEVICE_AUTHENTICITY_ITEM_3' },
];

export const AuthenticateDeviceModal = () => {
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    const handleClick = async () => {
        setIsLoading(true);

        const result = await dispatch(
            checkDeviceAuthenticityThunk({ allowDebugKeys: isDebugModeActive }),
        ).unwrap();

        setIsLoading(false);

        if (result?.valid === false) {
            dispatch(openModal({ type: 'authenticate-device-fail' }));
        }
    };

    const handleClose = () => dispatch(onCancel());

    return (
        <Modal
            onCancel={handleClose}
            heading={<Translation id="TR_LETS_CHECK_YOUR_DEVICE" />}
            bottomContent={
                <>
                    <Modal.Button
                        onClick={handleClick}
                        isDisabled={isLoading}
                        isLoading={isLoading}
                    >
                        <Translation id="TR_START_CHECK" />
                    </Modal.Button>
                    <Modal.Button variant="tertiary" onClick={handleClose}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
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
        </Modal>
    );
};
