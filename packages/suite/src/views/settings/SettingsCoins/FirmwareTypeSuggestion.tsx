import styled from 'styled-components';

import { setFlag } from 'src/actions/suite/suiteActions';
import { goto } from 'src/actions/suite/routerActions';
import { TextColumn, Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { Button, Card } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';

const StyledCard = styled(Card)`
    align-items: flex-start;
    border-left: 10px solid ${({ theme }) => theme.TYPE_GREEN};
    box-shadow: 0 2px 5px 0 ${({ theme }) => theme.BOX_SHADOW_BLACK_20};
    flex-direction: row;
    justify-content: space-between;
`;

const StyledButton = styled(Button)`
    display: inline;
`;

export const FirmwareTypeSuggestion = () => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const translationId = hasBitcoinOnlyFirmware(device)
        ? 'TR_SETTINGS_COINS_REGULAR_FIRMWARE_SUGGESTION'
        : 'TR_SETTINGS_COINS_BITCOIN_ONLY_FIRMWARE_SUGGESTION';

    const handleClose = () => dispatch(setFlag('firmwareTypeBannerClosed', true));
    const goToFirmwareType = () =>
        dispatch(goto('settings-device', { anchor: SettingsAnchor.FirmwareType }));

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
                            bitcoinOnly: <Translation id="TR_FIRMWARE_TYPE_BITCOIN_ONLY" />,
                            regular: <Translation id="TR_FIRMWARE_TYPE_REGULAR" />,
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
