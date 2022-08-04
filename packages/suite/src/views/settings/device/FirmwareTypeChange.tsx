import React from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useDevice, useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import { getFwType, getFwVersion, isDeviceBitcoinOnly } from '@suite-utils/device';
import { Button } from '@trezor/components';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

const Version = styled.div`
    span {
        display: flex;
        align-items: center;

        > :last-child {
            margin-left: 6px;
        }
    }
`;

interface FirmwareTypeProps {
    isDeviceLocked: boolean;
}

export const FirmwareTypeChange = ({ isDeviceLocked }: FirmwareTypeProps) => {
    const { device } = useDevice();
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.FirmwareType);

    if (!device?.features) {
        return null;
    }

    const currentFwVersion = getFwVersion(device);
    const currentFwType = getFwType(device);
    const actionButtonId = isDeviceBitcoinOnly(device)
        ? 'TR_SWITCH_TO_UNIVERSAL'
        : 'TR_SWITCH_TO_BITCOIN';

    const handleAction = () => {
        goto('firmware-type', {
            params: { cancelable: true },
        });
    };

    return (
        <SectionItem
            data-test="@settings/device/firmware-type"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_FIRMWARE_TYPE" />}
                description={
                    currentFwVersion ? (
                        <Version>
                            <Translation
                                id="TR_YOUR_FIRMWARE_TYPE"
                                values={{
                                    version: (
                                        <Button
                                            variant="tertiary"
                                            // icon={revision ? 'EXTERNAL_LINK' : undefined}
                                            // alignIcon="right"
                                            disabled // TODO: this should link to an article in knowledge base or guide in the future
                                        >
                                            {currentFwType}
                                        </Button>
                                    ),
                                }}
                            />
                        </Version>
                    ) : (
                        <Translation id="TR_YOUR_CURRENT_FIRMWARE_UNKNOWN" />
                    )
                }
            />
            <ActionColumn>
                <ActionButton
                    variant="secondary"
                    onClick={handleAction}
                    data-test="@settings/device/switch-fw-type-button"
                    isDisabled={isDeviceLocked}
                >
                    <Translation id={actionButtonId} />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
