import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { isNetworkIconSymbol } from '@suite-common/icons';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box, Card, Column, IconButton, Row, StatusBadge, Text } from '@trezor/components';
import { SlidersIcon } from '@trezor/icons';
import { NetworkIcon } from '@trezor/product-components';

import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

import { RepresentativeAssetIconSet } from './RepresentativeAssetIconSet';
import { type BackendStatus } from './getBackendStatus';

type NetworkCardProps = {
    symbol: NetworkSymbol;
    name: string;
    backendStatus?: BackendStatus;
    isEnabled: boolean;
    isDisabled: boolean;
    isCardClickable?: boolean;
    onClick?: (symbol: NetworkSymbol, isEnabled: boolean) => void;
    onSettings?: (symbol: NetworkSymbol) => void;
    rightContent?: ReactNode;
    showRepresentativeAssets?: boolean;
};

export const NetworkCard = ({
    symbol,
    name,
    backendStatus,
    isEnabled,
    isDisabled,
    isCardClickable = true,
    onClick,
    onSettings,
    rightContent,
    showRepresentativeAssets = true,
}: NetworkCardProps) => {
    const isBelowMobile = useIsContentBelowBreakpoint();

    return (
        <Box
            opacity={isDisabled ? 0.5 : 1}
            width="100%"
            pointerEvents={isDisabled ? 'none' : 'auto'}
        >
            <Card
                key={symbol}
                paddingType="none"
                data-testid={`@settings/wallet/network/${symbol}`}
                onClick={isCardClickable && onClick ? () => onClick(symbol, !isEnabled) : undefined}
            >
                <Row padding={{ vertical: 12, horizontal: 14 }} gap={12} maxWidth="100%">
                    {isNetworkIconSymbol(symbol) && (
                        <NetworkIcon size={24} networkSymbol={symbol} />
                    )}
                    <Column flex="1" minWidth={0} minHeight={32} justifyContent="center">
                        <Text typographyStyle="body-sm-strong" ellipsisLineCount={1}>
                            {name}
                        </Text>
                    </Column>
                    <Row gap={12} onClick={e => e.stopPropagation()} flex="0 0 auto">
                        {!isBelowMobile && showRepresentativeAssets && (
                            <RepresentativeAssetIconSet symbol={symbol} />
                        )}
                        {onSettings && (
                            // Make the clickable area bigger
                            <Box padding={8} margin={-8} onClick={() => onSettings(symbol)}>
                                <StatusBadge
                                    isShown={backendStatus !== undefined}
                                    data-testid={`@settings/wallet/network/${symbol}/backend-status`}
                                >
                                    <IconButton
                                        size="small"
                                        icon={SlidersIcon}
                                        data-testid={`@settings/wallet/network/${symbol}/advance`}
                                        tooltip={{
                                            content: <Translation id="TR_CUSTOM_BACKEND" />,
                                        }}
                                        onClick={e => {
                                            e.stopPropagation();
                                            onSettings(symbol);
                                        }}
                                        intent="neutral"
                                        priority="secondary"
                                    />
                                </StatusBadge>
                            </Box>
                        )}
                        {rightContent}
                    </Row>
                </Row>
            </Card>
        </Box>
    );
};
