import { type CryptoId, type DexApprovalType, type ProviderMetadata } from 'invity-api';
import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { type AmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { Box, CollapsibleBox, Column, Paragraph, RadioCard, Row, Text } from '@trezor/components';
import { borders } from '@trezor/theme';

import { DebugOnlyBadge } from 'src/components/suite/DebugOnlyBadge';
import { useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/selectors/suite/suiteSelectors';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';

interface ApproveModalTypeSelectorProps {
    approvalType: DexApprovalType;
    isLoading: boolean;
    data: string;
    cryptoId: CryptoId;
    onSelect: (type: DexApprovalType) => void;
    provider: ProviderMetadata;
    token: TokenInfo;
    displayAmount: AmountSubunit;
}

const BreakableValue = styled.span`
    word-break: break-all;
`;

export const ApproveModalTypeSelector = ({
    approvalType,
    isLoading,
    data,
    cryptoId,
    onSelect,
    provider,
    token,
    displayAmount,
}: ApproveModalTypeSelectorProps) => {
    const isDebug = useSelector(selectIsDebugModeActive);

    const translationValues = {
        value: subunitsToUnits({ value: displayAmount, decimals: token.decimals }).toString(),
        send: token.symbol ? getDisplaySymbol(token.symbol) : '',
        provider: provider.name,
    };

    return (
        <Box borderWidth={borders.widths.large} padding={12} borderRadius={borders.radii.sm}>
            <Column gap={12}>
                <Text>
                    <Translation id="TR_EXCHANGE_APPROVAL_SET_LIMIT" />
                </Text>
                <RadioCard
                    isActive={approvalType === 'INFINITE'}
                    isDisabled={isLoading}
                    onClick={() => onSelect('INFINITE')}
                >
                    <Row>
                        <TradingCoinLogo cryptoId={cryptoId} size={20} margin={{ right: 4 }} />
                        <Text>
                            <Translation id="TR_EXCHANGE_APPROVAL_VALUE_INFINITE" />
                        </Text>
                    </Row>
                    <Paragraph
                        margin={{ top: 4 }}
                        typographyStyle="body-sm"
                        intent="neutral"
                        priority="secondary"
                    >
                        <Translation
                            id="TR_EXCHANGE_APPROVAL_VALUE_INFINITE_INFO"
                            values={translationValues}
                        />
                    </Paragraph>
                </RadioCard>
                <RadioCard
                    isActive={approvalType === 'MINIMAL'}
                    isDisabled={isLoading}
                    onClick={() => onSelect('MINIMAL')}
                >
                    <Row>
                        <TradingCoinLogo cryptoId={cryptoId} size={20} margin={{ right: 4 }} />
                        <Text>
                            <Translation
                                id="TR_EXCHANGE_APPROVAL_VALUE_MINIMAL"
                                values={translationValues}
                            />
                        </Text>
                    </Row>
                    <Paragraph
                        margin={{ top: 4 }}
                        typographyStyle="body-sm"
                        intent="neutral"
                        priority="secondary"
                    >
                        <Translation
                            id="TR_EXCHANGE_APPROVAL_VALUE_MINIMAL_INFO"
                            values={translationValues}
                        />
                    </Paragraph>
                </RadioCard>
                {isDebug ? (
                    <CollapsibleBox
                        heading={
                            <DebugOnlyBadge>
                                <Translation id="TR_EXCHANGE_APPROVAL_DATA" />
                            </DebugOnlyBadge>
                        }
                    >
                        <BreakableValue>{data}</BreakableValue>
                    </CollapsibleBox>
                ) : null}
            </Column>
        </Box>
    );
};
