import styled, { DefaultTheme, useTheme } from 'styled-components';
import {
    useDevice,
    // useTranslation
} from '../../../../../../hooks/suite';
import { ComponentWithSubIcon, Icon, IconName, iconSizes, Row } from '@trezor/components';
import { QuickActionButton } from './QuickActionButton';
import { UpdateIconGroup, UpdateIconGroupVariant } from './UpdateIconGroup';
import { borders, Color, CSSColor, spacingsPx } from '@trezor/theme';

type MapArgs = {
    $variant: UpdateIconGroupVariant;
    theme: DefaultTheme;
};

export const mapVariantToIconColor = ({ $variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<UpdateIconGroupVariant, Color> = {
        info: 'iconAlertBlue',
        purple: 'iconAlertPurple',
        tertiary: 'iconSubdued',
    };

    return theme[colorMap[$variant]];
};

const SuiteIconRectangle = styled.div<{ $variant: UpdateIconGroupVariant }>`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${spacingsPx.xxxs};

    border-radius: ${borders.radii.xxs};
    background-color: ${({ $variant, theme }) => mapVariantToIconColor({ $variant, theme })};
`;

export const Update = () => {
    const theme = useTheme();
    // const { translationString } = useTranslation();

    const { device } = useDevice();

    const isFirmwareOutdated = device?.firmware === 'outdated';
    const variant: UpdateIconGroupVariant = isFirmwareOutdated ? 'info' : 'tertiary';
    const updateSubIcon: IconName | undefined = device === undefined ? undefined : 'check';

    return (
        <QuickActionButton tooltip="Lorem Ipsum">
            <ComponentWithSubIcon
                variant={variant}
                subIconProps={
                    updateSubIcon !== undefined
                        ? {
                              name: updateSubIcon,
                              color: theme['iconDefaultInverted'],
                              size: iconSizes.extraSmall,
                          }
                        : undefined
                }
            >
                <UpdateIconGroup $variant={variant}>
                    <Row>
                        {device?.features !== undefined ? (
                            <Icon
                                name={`trezor${device.features.internal_model}`}
                                size={iconSizes.medium}
                                variant={variant}
                            />
                        ) : null}
                        <SuiteIconRectangle $variant={variant}>
                            <Icon
                                name="trezor"
                                size={iconSizes.small}
                                color={theme['iconDefaultInverted']}
                            />
                        </SuiteIconRectangle>
                    </Row>
                </UpdateIconGroup>
            </ComponentWithSubIcon>
        </QuickActionButton>
    );
};
