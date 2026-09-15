import { useCallback } from 'react';

import { Form } from '@suite/form';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { ChangeDeviceLabelForm } from 'src/components/suite/ChangeDeviceLabelForm';
import { MAX_LABEL_LENGTH } from 'src/constants/suite/device';
import { useChangeDeviceLabel } from 'src/hooks/suite/useChangeDeviceLabel';

type DeviceLabelProps = {
    isDeviceLocked: boolean;
};

export const DeviceLabel = ({ isDeviceLocked }: DeviceLabelProps) => {
    const { form, handleSubmit } = useChangeDeviceLabel();

    const onSubmit = useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            event.preventDefault();
            handleSubmit();
        },
        [handleSubmit],
    );

    const { formState } = form;

    return (
        <Anchor anchorId={SettingsAnchor.DeviceLabel}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
                    <TextColumn
                        title={<Translation id="TR_DEVICE_SETTINGS_DEVICE_LABEL" />}
                        description={
                            <Translation
                                id="TR_LABEL_REQUIREMENTS"
                                values={{ length: MAX_LABEL_LENGTH }}
                            />
                        }
                    />
                    <ActionColumn>
                        <Form form={form} formState={formState}>
                            <ChangeDeviceLabelForm
                                isVertical
                                isDeviceLocked={isDeviceLocked}
                                onClick={onSubmit}
                            />
                        </Form>
                    </ActionColumn>
                </SectionItem>
            )}
        </Anchor>
    );
};
