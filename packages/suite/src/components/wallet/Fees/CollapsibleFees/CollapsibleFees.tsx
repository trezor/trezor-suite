import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';

import { Translation, TranslationKey } from '@suite/intl';
import { NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import { FormState } from '@suite-common/wallet-types';
import { Button, Collapsible, Column, Row, TextButton } from '@trezor/components';
import { TypographyStyle, spacings } from '@trezor/theme';

import { CollapsibleFeesHeader } from './CollapsibleFeesHeader';
import { CustomFee } from './CustomFee/CustomFee';
import { MaximumFee } from './MaximumFee';
import { StandardFee } from './StandardFee/StandardFee';
import { FeesContext, FeesContextType } from '../context/FeesContext';
import { useTransactionMaxFee } from './hooks/useTransactionMaxFee';
import { ContentFlex } from '../../../../support/suite/ContentFlex';

export type CollapsibleFeesProps = {
    networkType: NetworkType;
    networkSymbol: NetworkSymbol;
    label?: TranslationKey;
    rbfForm?: boolean;
    headerTypographyStyle?: TypographyStyle;
} & Pick<FeesContextType, 'feeInfo' | 'composedLevels' | 'changeFeeLevel'>;

export function CollapsibleFees({
    label,
    networkType,
    networkSymbol,
    feeInfo,
    composedLevels,
    changeFeeLevel,
    rbfForm,
    headerTypographyStyle = 'body',
}: CollapsibleFeesProps) {
    const selectedFee = useWatch<FormState, 'selectedFee'>({
        name: 'selectedFee',
        defaultValue: 'normal',
    });
    const supportsAdjustableFees = networkType !== 'solana';
    const isCustomFee = supportsAdjustableFees && selectedFee === 'custom';

    // when fees are loading, feeInfo.levels = [], but CustomFee requires at least the 'normal' level to have some default
    const hasNormalFeeLevel = useMemo(
        () => feeInfo.levels.some(level => level.label === 'normal'),
        [feeInfo.levels],
    );

    const selectedFeeLevel = useMemo(
        () => feeInfo.levels.find(level => level.label === selectedFee),
        [feeInfo.levels, selectedFee],
    );

    const txMaxFee = useTransactionMaxFee({
        networkSymbol,
        composedLevels,
        selectedFeeLevel,
    });

    return (
        <FeesContext.Provider
            value={{
                networkSymbol,
                networkType,
                feeInfo,
                changeFeeLevel,
                selectedFeeLevel,
                composedLevels,
            }}
        >
            <Collapsible gap={20}>
                <ContentFlex justifyContent="space-between" gap={12}>
                    <CollapsibleFeesHeader label={label} typographyStyle={headerTypographyStyle} />
                    <Collapsible.Toggle
                        data-testid="@wallet/fees/collapsible-fees-toggle"
                        disabled={!supportsAdjustableFees}
                    >
                        <Row gap={10}>
                            <MaximumFee
                                typographyStyle={headerTypographyStyle}
                                txMaxFee={txMaxFee}
                            />
                            {supportsAdjustableFees && (
                                <Collapsible.ToggleIcon iconName="caretDown" size="mediumLarge" />
                            )}
                        </Row>
                    </Collapsible.Toggle>
                </ContentFlex>
                {supportsAdjustableFees && (
                    <Collapsible.Content overflow="unset">
                        <Column gap={16}>
                            <Column gap={16}>
                                {!isCustomFee && <StandardFee />}
                                {isCustomFee && <CustomFee showCurrentFee={!rbfForm} />}
                            </Column>

                            <Row justifyContent="center" margin={{ bottom: spacings.xs }}>
                                {isCustomFee && (
                                    <Button
                                        intent="neutral"
                                        priority="secondary"
                                        onClick={() => changeFeeLevel('normal')}
                                        data-testid="@wallet/fees/select-standard-fee"
                                    >
                                        <Translation id="FEE_LEVEL_STANDARD" />
                                    </Button>
                                )}
                                {!isCustomFee && hasNormalFeeLevel && (
                                    <TextButton
                                        onClick={() => changeFeeLevel('custom')}
                                        data-testid="@wallet/fees/select-custom-fee"
                                        intent="neutral"
                                        size="small"
                                        isUnderlined
                                    >
                                        <Translation id="FEE_LEVEL_ADVANCED" />
                                    </TextButton>
                                )}
                            </Row>
                        </Column>
                    </Collapsible.Content>
                )}
            </Collapsible>
        </FeesContext.Provider>
    );
}
