import styled, { useTheme } from 'styled-components';

import { FirmwareOperationStatus } from '@suite-common/firmware';
import { TranslationKey } from '@suite-common/intl-types';
import { Box, Column, ProgressBar, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { useFirmwareDesktopUpdate } from 'src/hooks/suite/useFirmwareDesktopUpdate';

import { useSelector } from '../../hooks/suite';

const Percentage = styled.div`
    font-variant-numeric: tabular-nums;
    width: 30px;
`;

export const FirmwareProgressBar = () => {
    const theme = useTheme();
    const { operation, progress, uiEvent } = useFirmwareDesktopUpdate();
    const isActiveOnboarding = useSelector(state => state.onboarding.isActive);

    const mapOperationToTranslationId: Record<
        NonNullable<FirmwareOperationStatus['operation']>,
        TranslationKey
    > = {
        installing: 'TR_INSTALLING',
        restarting: isActiveOnboarding
            ? 'TR_RESTARTING_TREZOR'
            : 'TR_RESTARTING_TREZOR_ENTER_PIN_IF_NEEDED',
        thp: 'TR_FIRMWARE_STATUS_INSTALLATION_COMPLETED',
        completed: 'TR_FIRMWARE_STATUS_INSTALLATION_COMPLETED',
    };

    return (
        <Box width="100%">
            <Column margin={{ vertical: spacings.md, horizontal: spacings.lg }}>
                <Text typographyStyle="hint" variant="tertiary">
                    {operation ? <Translation id={mapOperationToTranslationId[operation]} /> : ' '}
                </Text>

                <Row gap={spacings.lg} justifyContent="space-between">
                    <ProgressBar
                        value={progress}
                        backgroundColor={theme.backgroundNeutralSubtleOnElevationNegative}
                    />
                    <Percentage>
                        <Text typographyStyle="highlight">
                            {progress}
                            {'\u00A0'}%
                        </Text>
                    </Percentage>
                </Row>
            </Column>
        </Box>
    );
};
