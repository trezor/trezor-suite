import { useMemo } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { isTronAccountActivation } from '@suite-common/wallet-utils';
import { Row, Text, TextButton, Tooltip } from '@trezor/components';
import { type TypographyStyle } from '@trezor/theme';
import { HELP_CENTER_TRANSACTION_FEES_URL } from '@trezor/urls';

import { useFeesContext } from '../context/FeesContext';
import { getFeeTooltipTextId } from '../feeUtils';

export type CollapsibleFeesHeaderProps = {
    label?: TranslationKey;
    typographyStyle: TypographyStyle;
    supportsAdjustableFees?: boolean;
};

export function CollapsibleFeesHeader({
    label,
    typographyStyle,
    supportsAdjustableFees,
}: CollapsibleFeesHeaderProps) {
    const { networkType, networkSymbol, composedLevels } = useFeesContext();

    const feeTooltipTextId = useMemo(
        () =>
            getFeeTooltipTextId({
                networkType,
                isTronAccountActivation: isTronAccountActivation(composedLevels?.normal),
            }),
        [networkType, composedLevels],
    );

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
                content={
                    <Translation
                        id={feeTooltipTextId}
                        values={{
                            br: <br />,
                            networkDisplaySymbol: getNetworkDisplaySymbol(networkSymbol),
                        }}
                    />
                }
            >
                <Text typographyStyle={typographyStyle} intent="neutral" priority="secondary">
                    <Translation id={label ?? feeLabelId} />
                </Text>
            </Tooltip>
        </Row>
    );
}
