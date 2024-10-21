import React from 'react';
import { useMemo } from 'react';
import { Translation } from 'src/components/suite';
import { Icon } from '@trezor/components';
import { Column, Row } from '@trezor/components';
import { Text, TextVariant } from '@trezor/components';
import { spacings, SpacingValues, TypographyStyle } from '@trezor/theme';
import { Tooltip } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';

type ContractAddressWithTooltipProps = {
    contractAddress: string;
    tooltipTextTypographyStyle: TypographyStyle;
    variant: TextVariant;
    gap: SpacingValues;
    cryptoName: string;
    networkName: string;
    onClick?: (e: React.MouseEvent) => void; // Add onClick prop
};

export const ContractAddressWithTooltip = ({
    contractAddress,
    tooltipTextTypographyStyle,
    variant,
    gap,
    cryptoName,
    networkName,
    onClick, // Destructure onClick
}: ContractAddressWithTooltipProps) => {
    const shortenAddress = useMemo(() => {
        return `${contractAddress.slice(0, 4)}...${contractAddress.slice(-4)}`;
    }, [contractAddress]);

    const handleCopyClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClick) onClick(e); // Call the onClick prop if provided
        copyToClipboard(contractAddress);
    };

    const tooltipContent = (
        <Column gap={spacings.xxxs} justifyContent="flex-start" alignItems="flex-start">
            <Text variant="tertiary" typographyStyle="titleSmall">
                <Translation
                    id="TR_TOKEN_ON_NETWORK"
                    values={{ tokenName: cryptoName, networkName }}
                />
            </Text>
            <div onClick={handleCopyClick} style={{ cursor: 'pointer' }}>
                <Text variant="default" typographyStyle="body">
                    <Row gap={spacings.xxs}>
                        {contractAddress} <Icon name="clipboard" size="medium" />
                    </Row>
                </Text>
            </div>
        </Column>
    );

    return (
        <Tooltip placement="bottom" content={tooltipContent}>
            <Text variant={variant} typographyStyle={tooltipTextTypographyStyle}>
                <Row gap={gap}>
                    <Translation id="TR_CONTRACT_ADDRESS" /> {shortenAddress}
                    <Icon name="infoFilled" variant="tertiary" size="small" />
                </Row>
            </Text>
        </Tooltip>
    );
};
