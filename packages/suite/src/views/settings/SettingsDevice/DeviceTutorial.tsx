import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { showDeviceTutorialThunk } from '@suite-common/wallet-core';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

interface DeviceTutorialProps {
    isDeviceLocked: boolean;
}

export const DeviceTutorial = ({ isDeviceLocked }: DeviceTutorialProps) => {
    const { dispatch } = useServices(injectDispatch);

    const handleClick = () => dispatch(showDeviceTutorialThunk({ source: 'settings' }));

    return (
        <Anchor anchorId={SettingsAnchor.DeviceTutorial}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                    title={<Translation id="TR_TREZOR_DEVICE_TUTORIAL_HEADING" />}
                    description={<Translation id="TR_TREZOR_DEVICE_TUTORIAL_DESCRIPTION" />}
                    actions={
                        <SectionItem.Button
                            data-testid="@settings/device/tutorial-button"
                            onClick={handleClick}
                            isDisabled={isDeviceLocked}
                            tooltip={{
                                isActive: isDeviceLocked,
                                content: <Translation id="TR_CONNECT_UNLOCK_YOUR_DEVICE" />,
                            }}
                        >
                            <Translation id="TR_START" />
                        </SectionItem.Button>
                    }
                />
            )}
        </Anchor>
    );
};
