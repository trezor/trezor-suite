import styled from 'styled-components';

import { setFlag } from 'src/actions/suite/suiteActions';
import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { Box, Button } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { spacingsPx, typography } from '@trezor/theme';

const Row = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
    gap: ${spacingsPx.sm};
`;

const StyledButton = styled(Button)`
    display: inline;
`;

const Description = styled.div`
    ${typography.hint};
    color: ${({ theme }) => theme.textSubdued};
`;

const FirmwareTypeSuggestionDescription = () => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const translationId = hasBitcoinOnlyFirmware(device)
        ? 'TR_SETTINGS_COINS_REGULAR_FIRMWARE_SUGGESTION'
        : 'TR_SETTINGS_COINS_BITCOIN_ONLY_FIRMWARE_SUGGESTION';

    const goToFirmwareType = () =>
        dispatch(goto('settings-device', { anchor: SettingsAnchor.FirmwareType }));

    return (
        <Description>
            <Translation
                id={translationId}
                values={{
                    button: chunks => (
                        <StyledButton variant="tertiary" size="tiny" onClick={goToFirmwareType}>
                            {chunks}
                        </StyledButton>
                    ),
                    bitcoinOnly: <Translation id="TR_FIRMWARE_TYPE_BITCOIN_ONLY" />,
                    regular: <Translation id="TR_FIRMWARE_TYPE_REGULAR" />,
                }}
            />
        </Description>
    );
};

export const FirmwareTypeSuggestion = () => {
    const dispatch = useDispatch();

    const handleClose = () => dispatch(setFlag('firmwareTypeBannerClosed', true));

    return (
        <Box variant="primary" margin={{ bottom: 20 }}>
            <Row>
                <FirmwareTypeSuggestionDescription />
                <Button variant="tertiary" size="small" onClick={handleClose}>
                    <Translation id="TR_GOT_IT" />
                </Button>
            </Row>
        </Box>
    );
};
