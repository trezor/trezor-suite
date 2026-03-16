import styled, { useTheme } from 'styled-components';

import { Translation, type TranslationKey } from '@suite/intl';
import { type FirmwareOperationStatus } from '@suite-common/firmware';
import { Box, Column, ProgressBar, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useFirmwareDesktopUpdate } from 'src/hooks/suite/useFirmwareDesktopUpdate';

const Percentage = styled.div`
    font-variant-numeric: tabular-nums;
    width: 30px;
`;

export const FirmwareProgressBar = () => {
    const theme = useTheme();
    const { operation, progress } = useFirmwareDesktopUpdate();

    const mapOperationToTranslationId: Record<
        NonNullable<FirmwareOperationStatus['operation']>,
        TranslationKey
    > = {
        installing: 'TR_INSTALLING',
        restarting: 'TR_RESTARTING_TREZOR',
        completed: 'TR_FIRMWARE_STATUS_INSTALLATION_COMPLETED',
    };

    return (
        <Box width="100%">
            <Column margin={{ vertical: spacings.md, horizontal: spacings.lg }}>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {operation ? <Translation id={mapOperationToTranslationId[operation]} /> : ' '}
                </Text>

                <Row gap={spacings.lg} justifyContent="space-between">
                    <ProgressBar
                        value={progress}
                        backgroundColor={theme.backgroundNeutralSubtleOnElevationNegative}
                    />
                    <Percentage>
                        <Text typographyStyle="body-md-strong">
                            {progress}
                            {'\u00A0'}%
                        </Text>
                    </Percentage>
                </Row>
            </Column>
        </Box>
    );
};
