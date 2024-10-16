import { useMemo } from 'react';
import { Translation } from '../../../../suite/src/components/suite/Translation';
import { Icon } from '../Icon/Icon';
import { Row } from '../Flex/Flex';
import { Text, TextVariant } from '../typography/Text/Text';
import { SpacingValues, TypographyStyle } from '@trezor/theme';

type ContractAddressWithTooltipProps = {
    contractAddress: string;
    tooltipTextTypographyStyle: TypographyStyle;
    variant: TextVariant;
    gap: SpacingValues;
};

export const ContractAddressWithTooltip = ({
    contractAddress,
    tooltipTextTypographyStyle,
    variant,
    gap,
}: ContractAddressWithTooltipProps) => {
    const shortenAddress = useMemo(() => {
        return `${contractAddress.slice(0, 4)}...${contractAddress.slice(-4)}`;
    }, [contractAddress]);

    return (
        <Text variant={variant} typographyStyle={tooltipTextTypographyStyle}>
            <Row gap={gap}>
                <Translation id="TR_CONTRACT_ADDRESS" /> {shortenAddress}
                <Icon name="infoFilled" variant="tertiary" size="small" />
            </Row>
        </Text>
    );
};
