import styled, { useTheme } from 'styled-components';

import { Text, Radio, IconLegacy, useElevation } from '@trezor/components';
import { Elevation, borders, mapElevationToBorder, spacingsPx, typography } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { ContentType } from '../types';
import { AcquiredDevice } from '@suite-common/suite-types';

type ViewOnlyRadiosProps = {
    isViewOnlyActive: boolean;
    toggleViewOnly: () => void;
    'data-testid'?: string;
    setContentType: (contentType: ContentType) => void;
    device: AcquiredDevice;
};
type ViewOnlyRadioProps = {
    title: React.ReactNode;
    children: React.ReactNode;
    onClick: () => void;
    isChecked: boolean;
    'data-testid'?: string;
};
const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xs};
`;
const Left = styled.div``;

const Title = styled.div``;

const Item = styled.div<{ $elevation: Elevation; $isChecked: boolean }>`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xs};
    border-radius: ${borders.radii.md};
    padding: ${spacingsPx.md};
    border: solid 1.5px
        ${({ theme, $isChecked, $elevation }) =>
            $isChecked
                ? theme.backgroundSecondaryDefault
                : mapElevationToBorder({ theme, $elevation })};
`;

const SendCoinsInfo = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    margin: ${spacingsPx.md} auto;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.label}
`;

export const ViewOnlyRadio = ({
    title,
    children,
    onClick,
    isChecked,
    'data-testid': dataTest,
}: ViewOnlyRadioProps) => {
    const { elevation } = useElevation();
    const theme = useTheme();

    return (
        <Item onClick={onClick} $elevation={elevation} $isChecked={isChecked}>
            <Left>
                <Title>{title}</Title>
                <Text typographyStyle="hint" color={theme.textSubdued}>
                    {children}
                </Text>
            </Left>
            <Radio onClick={onClick} isChecked={isChecked} data-testid={dataTest} />
        </Item>
    );
};
export const ViewOnlyRadios = ({
    isViewOnlyActive,
    toggleViewOnly,
    'data-testid': dataTest,
    setContentType,
    device,
}: ViewOnlyRadiosProps) => {
    const theme = useTheme();
    const isDeviceConnected = device?.connected && device?.available;

    const handleConfirm = (newValue: boolean) => {
        const isValueChanged = isViewOnlyActive !== newValue;

        if (isValueChanged) {
            if (newValue === false && !isDeviceConnected) {
                setContentType('disabling-view-only-ejects-wallet');
            } else {
                toggleViewOnly();
            }
        }
    };

    return (
        <Container>
            <ViewOnlyRadio
                title={<Translation id="TR_VIEW_ONLY_RADIOS_ENABLED_TITLE" />}
                onClick={() => handleConfirm(true)}
                isChecked={isViewOnlyActive}
                data-testid={`${dataTest}/enabled`}
            >
                <Translation
                    id="TR_VIEW_ONLY_RADIOS_ENABLED_DESCRIPTION"
                    values={{
                        strong: chunks => <strong>{chunks}</strong>,
                    }}
                />
            </ViewOnlyRadio>
            <ViewOnlyRadio
                title={<Translation id="TR_VIEW_ONLY_RADIOS_DISABLED_TITLE" />}
                onClick={() => handleConfirm(false)}
                isChecked={!isViewOnlyActive}
                data-testid={`${dataTest}/disabled`}
            >
                <Translation
                    id="TR_VIEW_ONLY_RADIOS_DISABLED_DESCRIPTION"
                    values={{
                        strong: chunks => <strong>{chunks}</strong>,
                    }}
                />
            </ViewOnlyRadio>

            <SendCoinsInfo>
                <IconLegacy icon="INFO" size={12} color={theme.iconSubdued} />
                <Translation id="TR_VIEW_ONLY_SEND_COINS_INFO" />
            </SendCoinsInfo>
        </Container>
    );
};
