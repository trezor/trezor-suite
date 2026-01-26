import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import { FormState } from '@suite-common/wallet-types';
import { Button, Collapsible, Column, Row, TextButton } from '@trezor/components';

import {
    CollapsibleFeesHeaderContent,
    CollapsibleFeesHeaderContentProps,
} from './CollapsibleFeesHeaderContent';
import { CustomFee } from './CustomFee/CustomFee';
import { StandardFee } from './StandardFee/StandardFee';
import { FeesContext, FeesContextType } from '../context/FeesContext';
import { useTransactionMaxFee } from './hooks/useTransactionMaxFee';

export type CollapsibleFeesProps = {
    networkSymbol: NetworkSymbol;
    networkType: NetworkType;
    rbfForm?: boolean;
} & Pick<FeesContextType, 'feeInfo' | 'composedLevels' | 'changeFeeLevel'> &
    Omit<CollapsibleFeesHeaderContentProps, 'supportsAdjustableFees' | 'txMaxFee'>;

export function CollapsibleFees({
    label,
    networkType,
    networkSymbol,
    feeInfo,
    composedLevels,
    changeFeeLevel,
    rbfForm,
    headerTypographyStyle = 'body',
    isHeaderRowLayout,
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
            <Collapsible>
                <CollapsibleFeesHeaderContent
                    label={label}
                    headerTypographyStyle={headerTypographyStyle}
                    supportsAdjustableFees={supportsAdjustableFees}
                    isHeaderRowLayout={isHeaderRowLayout}
                    txMaxFee={txMaxFee}
                />

                {supportsAdjustableFees && (
                    <Collapsible.Content overflow="unset">
                        <Column gap={16}>
                            <Column gap={16}>
                                {!isCustomFee && <StandardFee />}
                                {isCustomFee && <CustomFee showCurrentFee={!rbfForm} />}
                            </Column>

                            <Row justifyContent="center" margin={{ bottom: 8 }}>
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
