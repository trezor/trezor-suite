import styled, { useTheme } from 'styled-components';

import { Column, Icon, List, Row, Text, iconSizes } from '@trezor/components';
import { borders, spacings, spacingsPx } from '@trezor/theme';

import { TroubleshootingTipsItem } from './TroubleshootingTips';

const IconWrapper = styled.div`
    border: ${borders.widths.small} solid
        ${({ theme }) => theme.backgroundAlertBlueSubtleOnElevationNegative};
    border-radius: ${borders.radii.sm};
    background: ${({ theme }) => theme.backgroundAlertBlueSubtleOnElevation1};
    padding: ${spacingsPx.xs};
`;

type TroubleshootingTipsItemProps = {
    item: TroubleshootingTipsItem;
};

export const TroubleshootingTipsItemComponent = ({ item }: TroubleshootingTipsItemProps) => {
    const theme = useTheme();

    return (
        <List.Item
            bulletComponent={
                item.icon ? (
                    <IconWrapper>
                        <Icon
                            color={theme.iconAlertBlue}
                            name={item.icon ?? 'dotOutlineFilled'}
                            size={iconSizes.large}
                        />
                    </IconWrapper>
                ) : (
                    <Icon
                        color={theme.iconAlertBlue}
                        name="dotOutlineFilled"
                        size={iconSizes.large}
                    />
                )
            }
        >
            <Row justifyContent="space-between" alignItems="center">
                <Column gap={spacings.xs}>
                    <Text typographyStyle="body">{item.heading}</Text>
                    <Text typographyStyle="hint" variant="tertiary">
                        {item.description}
                    </Text>
                </Column>
            </Row>
        </List.Item>
    );
};
