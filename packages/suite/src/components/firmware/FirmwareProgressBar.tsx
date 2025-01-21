import styled, { useTheme } from 'styled-components';

import { Box, Column, Icon, ProgressBar, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { TranslationKey } from '@suite-common/intl-types';
import { FirmwareOperationStatus, useFirmwareInstallation } from '@suite-common/firmware';

import { Translation } from '../suite';

const Percentage = styled.div`
    font-variant-numeric: tabular-nums;
    width: 30px;
`;

const mapOperationToTransaltionId: Record<
    NonNullable<FirmwareOperationStatus['operation']>,
    TranslationKey
> = {
    installing: 'TR_INSTALLING',
    validating: 'TR_VALIDATION',
    restarting: 'TR_WAIT_FOR_REBOOT',
    completed: 'TR_FIRMWARE_STATUS_INSTALLATION_COMPLETED',
};

export const FirmwareProgressBar = () => {
    const theme = useTheme();
    const { operation, progress } = useFirmwareInstallation();

    const isDone = progress === 100;

    return (
        <Box width="100%">
            <Column margin={{ vertical: spacings.md, horizontal: spacings.lg }}>
                <Text typographyStyle="hint" variant="tertiary">
                    {operation ? <Translation id={mapOperationToTransaltionId[operation]} /> : ' '}
                </Text>

                <Row gap={spacings.lg} justifyContent="space-between">
                    <ProgressBar
                        value={progress}
                        backgroundColor={theme.backgroundNeutralSubtleOnElevationNegative}
                    />
                    <Percentage>
                        {isDone ? (
                            <Icon name="check" variant="primary" size={24} />
                        ) : (
                            <Text typographyStyle="highlight">
                                {progress}
                                {'\u00A0'}%
                            </Text>
                        )}
                    </Percentage>
                </Row>
            </Column>
        </Box>
    );
};
