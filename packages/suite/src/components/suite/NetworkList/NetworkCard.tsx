import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box, Card, Column, IconButton, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

import { RepresentativeAssetIconSet } from './RepresentativeAssetIconSet';
import { StatusIndicator } from './StatusIndicator';
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
                    <CoinLogo size={24} symbol={symbol} type="network" />
                    <Column flex="1" minWidth={0} minHeight={32} justifyContent="center">
                        <Text typographyStyle="body-sm-strong" ellipsisLineCount={1}>
                            {name}
                        </Text>
                    </Column>
                    <Row gap={12} onClick={e => e.stopPropagation()} flex="0 0 auto">
                        {!isBelowMobile && <RepresentativeAssetIconSet symbol={symbol} />}
                        {onSettings && (
                            // Make the clickable area bigger
                            <Box padding={8} margin={-8} onClick={() => onSettings(symbol)}>
                                <StatusIndicator
                                    status={backendStatus}
                                    data-testid={`@settings/wallet/network/${symbol}/backend-status`}
                                >
                                    <IconButton
                                        size="small"
                                        icon="sliders"
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
                                </StatusIndicator>
                            </Box>
                        )}
                        {rightContent}
                    </Row>
                </Row>
            </Card>
        </Box>
    );
};
