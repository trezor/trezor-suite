import styled from 'styled-components';

import { setFlag } from 'src/actions/suite/suiteActions';
import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { Button, Card } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { spacingsPx, typography } from '@trezor/theme';

const StyledCard = styled(Card)`
    align-items: center;
    border-left: ${spacingsPx.xs} solid ${({ theme }) => theme.borderSecondary};
    box-shadow: 0 2px 5px 0 ${({ theme }) => theme.boxShadowBase};
    flex-direction: row;
    justify-content: space-between;
`;

const StyledButton = styled(Button)`
    display: inline;
`;

const Description = styled.div`
    ${typography.hint};
    color: ${({ theme }) => theme.textSubdued};
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
            <Button variant="tertiary" size="small" onClick={handleClose}>
                <Translation id="TR_GOT_IT" />
            </Button>
        </StyledCard>
    );
};
