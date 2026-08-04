import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import { type FormState } from '@suite-common/wallet-types';
import { type TronAccountExtraData } from '@trezor/blockchain-link-types';
import { Button, Collapsible, Column, Row, TextButton } from '@trezor/components';

import {
    CollapsibleFeesHeaderContent,
    type CollapsibleFeesHeaderContentProps,
} from './CollapsibleFeesHeaderContent';
import { CustomFee } from './CustomFee/CustomFee';
import { CustomFeeTron } from './CustomFee/CustomFeeTron';
import { StandardFee } from './StandardFee/StandardFee';
import { FeesContext, type FeesContextType } from '../context/FeesContext';
import { useTransactionMaxFee } from './hooks/useTransactionMaxFee';

export type CollapsibleFeesProps = {
    networkSymbol: NetworkSymbol;
    networkType: NetworkType;
    rbfForm?: boolean;
    isOpen?: boolean;
    tronResources?: TronAccountExtraData;
} & Pick<FeesContextType, 'feeInfo' | 'composedLevels' | 'changeFeeLevel'> &
    Omit<CollapsibleFeesHeaderContentProps, 'supportsAdjustableFees' | 'txMaxFee' | 'isOpen'>;

export function CollapsibleFees({
    label,
    networkType,
    networkSymbol,
    feeInfo,
    composedLevels,
    changeFeeLevel,
    rbfForm,
    headerTypographyStyle = 'body-md',
    isOpen,
    tronResources,
}: CollapsibleFeesProps) {
    const selectedFee = useWatch<FormState, 'selectedFee'>({ name: 'selectedFee' }) ?? 'normal';

    const isTrc20Transfer = useMemo(() => {
        if (networkType !== 'tron' || composedLevels == null) return false;
        const { normal } = composedLevels;

        return (
            normal != null && normal.type !== 'error' && 'token' in normal && normal.token != null
        );
    }, [networkType, composedLevels]);

    const supportsAdjustableFees =
        networkType !== 'solana' && (networkType !== 'tron' || isTrc20Transfer);
    const isCustomFee = supportsAdjustableFees && selectedFee === 'custom';

    // get default non-custom fee level, preferably normal
    const defaultFeeLevel = useMemo(
        () =>
            feeInfo.levels.find(level => level.label === 'normal')?.label ??
            feeInfo.levels.find(level => level.label !== 'custom')?.label,
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
                tronResources,
            }}
        >
            <Collapsible gap={12} isOpen={isOpen} data-testid="@wallet/fees/collapsible-fees">
                <CollapsibleFeesHeaderContent
                    label={label}
                    headerTypographyStyle={headerTypographyStyle}
                    supportsAdjustableFees={supportsAdjustableFees}
                    txMaxFee={txMaxFee}
                    isOpen={isOpen}
                />

                {supportsAdjustableFees && (
                    <Collapsible.Content overflow="unset" onClick={ev => ev.stopPropagation()}>
                        <Column gap={16}>
                            {isTrc20Transfer ? (
                                <CustomFeeTron />
                            ) : (
                                <>
                                    <Column gap={16}>
                                        {!isCustomFee && <StandardFee />}
                                        {isCustomFee && <CustomFee showCurrentFee={!rbfForm} />}
                                    </Column>

                                    <Row justifyContent="center" margin={{ bottom: 8 }}>
                                        {/* allow switching to non-custom fee only when there is some */}
                                        {isCustomFee && !!defaultFeeLevel && (
                                            <Button
                                                intent="neutral"
                                                priority="secondary"
                                                onClick={() => changeFeeLevel(defaultFeeLevel)}
                                                data-testid="@wallet/fees/select-standard-fee"
                                            >
                                                <Translation id="FEE_LEVEL_STANDARD" />
                                            </Button>
                                        )}
                                        {/* in order to have sensible default for custom fee, selected fee level must exist (see useFees hook) */}
                                        {!isCustomFee && !!selectedFeeLevel && (
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
                                </>
                            )}
                        </Column>
                    </Collapsible.Content>
                )}
            </Collapsible>
        </FeesContext.Provider>
    );
}
