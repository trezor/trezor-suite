import { useMemo } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { Row, Text, TextButton, Tooltip } from '@trezor/components';
import { type TypographyStyle } from '@trezor/theme';
import { HELP_CENTER_TRANSACTION_FEES_URL } from '@trezor/urls';

import { useFeesContext } from '../context/FeesContext';

export interface CollapsibleFeesHeaderProps {
    label?: TranslationKey;
    typographyStyle: TypographyStyle;
    supportsAdjustableFees?: boolean;
}

export function CollapsibleFeesHeader({
    label,
    typographyStyle,
    supportsAdjustableFees,
}: CollapsibleFeesHeaderProps) {
    const { networkType } = useFeesContext();

    const feeTooltipTextId = useMemo(() => {
        switch (networkType) {
            case 'ethereum':
                return 'TR_EVM_MAX_FEE_DESC';
            case 'stellar':
                return 'TR_STELLAR_FEE_DESC';
            case 'solana':
                return 'TR_SOL_FEE_DESC';
            default:
                return 'TR_TRANSACTION_FEE_DESC';
        }
    }, [networkType]);

    const feeLabelId = useMemo(() => {
        switch (networkType) {
            case 'ethereum':
                return 'MAX_FEE';
            case 'tron':
                return supportsAdjustableFees ? 'MAX_FEE' : 'NETWORK_FEE';
            case 'solana':
                return 'TR_TX_FEE_INCLUDING_RENT';
            default:
                return 'FEE';
        }
    }, [networkType, supportsAdjustableFees]);

    return (
        <Row flexWrap="wrap" justifyContent="space-between" gap={12} minHeight={44}>
            <Tooltip
                addon={
                    networkType === 'ethereum' && (
                        <TextButton
                            size="small"
                            intent="neutral"
                            priority="secondary"
                            href={HELP_CENTER_TRANSACTION_FEES_URL}
                        >
                            <Translation id="TR_LEARN" />
                        </TextButton>
                    )
                }
                hasIcon
                maxWidth={328}
                content={<Translation id={feeTooltipTextId} values={{ br: <br /> }} />}
            >
                <Text typographyStyle={typographyStyle}>
                    <Translation id={label ?? feeLabelId} />
                </Text>
            </Tooltip>
        </Row>
    );
}
