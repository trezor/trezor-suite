import styled, { useTheme } from 'styled-components';

import { Text, Radio, Icon, useElevation, Row, Column, Paragraph } from '@trezor/components';
import { Elevation, borders, mapElevationToBorder, spacings, spacingsPx } from '@trezor/theme';
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

const Left = styled.div``;

const Item = styled.div<{ $elevation: Elevation; $isChecked: boolean }>`
    border-radius: ${borders.radii.md};
    padding: ${spacingsPx.md};
    border: solid 1.5px
        ${({ theme, $isChecked, $elevation }) =>
            $isChecked
                ? theme.backgroundSecondaryDefault
                : mapElevationToBorder({ theme, $elevation })};
`;

export const ViewOnlyRadio = ({
    title,
    children,
    onClick,
    isChecked,
    'data-testid': dataTest,
}: ViewOnlyRadioProps) => {
    const { elevation } = useElevation();

    return (
        <Item onClick={onClick} $elevation={elevation} $isChecked={isChecked}>
            <Row gap={spacings.sm}>
                <Left>
                    <Paragraph>{title}</Paragraph>
                    <Paragraph typographyStyle="hint" variant="tertiary" textWrap="balance">
                        {children}
                    </Paragraph>
                </Left>
                <Radio onClick={onClick} isChecked={isChecked} data-testid={dataTest} />
            </Row>
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
        <Column gap={spacings.xs} alignItems="stretch">
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
            <Row gap={spacings.xxs} justifyContent="center" margin={{ top: spacings.xs }}>
                <Icon name="info" size={12} color={theme.iconSubdued} />
                <Text typographyStyle="label" variant="tertiary">
                    <Translation id="TR_VIEW_ONLY_SEND_COINS_INFO" />
                </Text>
            </Row>
        </Column>
    );
};
