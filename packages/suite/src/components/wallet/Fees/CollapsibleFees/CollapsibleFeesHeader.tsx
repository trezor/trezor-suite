import { useMemo } from 'react';

import { useTheme } from 'styled-components';

import { Translation, TranslationKey } from '@suite/intl';
import { Icon, Link, Row, Text, Tooltip } from '@trezor/components';
import { TypographyStyle, spacings } from '@trezor/theme';
import { HELP_CENTER_TRANSACTION_FEES_URL } from '@trezor/urls';

import { useFeesContext } from '../context/FeesContext';

export interface CollapsibleFeesHeaderProps {
    label?: TranslationKey;
    typographyStyle: TypographyStyle;
}

export function CollapsibleFeesHeader({ label, typographyStyle }: CollapsibleFeesHeaderProps) {
    const { networkType } = useFeesContext();
    const theme = useTheme();

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
            case 'solana':
                return 'TR_TX_FEE_INCLUDING_RENT';
            default:
                return 'FEE';
        }
    }, [networkType]);

    return (
        <Row flexWrap="wrap" justifyContent="space-between" gap={spacings.sm} minHeight={44}>
            <Tooltip
                addon={
                    networkType === 'ethereum' && (
                        <Link href={HELP_CENTER_TRANSACTION_FEES_URL} target="_blank">
                            <Icon size={12} color={theme.iconAlertYellow} name="lightbulb" />
                            <Translation id="TR_LEARN" />
                        </Link>
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
