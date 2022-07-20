import React from 'react';
import styled from 'styled-components';

import * as suiteActions from '@suite-actions/suiteActions';
import * as routerActions from '@suite-actions/routerActions';
import { Translation } from '@suite-components';
import { TextColumn } from '@suite-components/Settings';
import { SettingsAnchor } from '@suite-constants/anchors';
import { useActions, useDevice } from '@suite-hooks';
import { isBitcoinOnly } from '@suite-utils/device';
import { Button, Card } from '@trezor/components';

const StyledCard = styled(Card)`
    align-items: flex-start;
    border-left: 10px solid ${props => props.theme.TYPE_GREEN};
    box-shadow: 0 2px 5px 0 ${props => props.theme.BOX_SHADOW_BLACK_20};
    flex-direction: row;
    justify-content: space-between;
`;

const StyledButton = styled(Button)`
    display: inline;
`;

export const FirmwareTypeSuggestion = () => {
    const { goto, setFlag } = useActions({
        goto: routerActions.goto,
        setFlag: suiteActions.setFlag,
    });
    const { device } = useDevice();

    const bitcoinOnlyFirmware = device && isBitcoinOnly(device);
    const translationId = bitcoinOnlyFirmware
        ? 'TR_SETTINGS_COINS_UNIVERSAL_FIRMWARE_SUGGESTION'
        : 'TR_SETTINGS_COINS_BITCOIN_FIRMWARE_SUGGESTION';

    const handleClose = () => setFlag('firmwareTypeBannerClosed', true);
    const goToFirmwareType = () =>
        goto('settings-device', {
            anchor: SettingsAnchor.FirmwareType,
        });

    return (
        <StyledCard>
            <TextColumn
                description={
                    <Translation
                        id={translationId}
                        values={{
                            button: chunks => (
                                <StyledButton variant="tertiary" onClick={goToFirmwareType}>
                                    {chunks}
                                </StyledButton>
                            ),
                        }}
                    />
                }
            />
            <Button variant="tertiary" onClick={handleClose}>
                <Translation id="TR_GOT_IT" />
            </Button>
        </StyledCard>
    );
};
