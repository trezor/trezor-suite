import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';

import { useTheme } from 'styled-components';

import { TranslationKey } from '@suite-common/intl-types';
import { NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import { FormState } from '@suite-common/wallet-types';
import { Button, CollapsibleBox, Column, Link, Row } from '@trezor/components';
import { TypographyStyle, spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';

import { CollapsibleFeesHeader } from './CollapsibleFeesHeader';
import { CustomFee } from './CustomFee/CustomFee';
import { MaximumFee } from './MaximumFee';
import { StandardFee } from './StandardFee/StandardFee';
import { FeesContext, FeesContextType } from '../context/FeesContext';

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

    const theme = useTheme();

    if (!selectedFeeLevel) {
        return null;
    }

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
            <CollapsibleBox
                heading={
                    <CollapsibleFeesHeader label={label} typographyStyle={headerTypographyStyle} />
                }
                hasDivider={false}
                toggleIconName="caretDown"
                toggleIconSize="mediumLarge"
                toggleIconVariant="default"
                fillType="none"
                paddingType="none"
                headingSize="large"
                overflow="unset"
                toggleComponent={
                    composedLevels === null ? null : (
                        <MaximumFee typographyStyle={headerTypographyStyle} />
                    )
                }
                collapsible={supportsAdjustableFees}
                data-testid-toggle="@wallet/fees/collapsible-fees-toggle"
            >
                <Column gap={spacings.md}>
                    <Column gap={spacings.md}>
                        {!isCustomFee && <StandardFee />}
                        {isCustomFee && <CustomFee showCurrentFee={!rbfForm} />}
                    </Column>

                    <Row justifyContent="center">
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
                            <Link
                                variant="underline"
                                typographyStyle="hint"
                                onClick={() => changeFeeLevel('custom')}
                                as="button"
                                color={theme.textSubdued}
                                data-testid="@wallet/fees/select-custom-fee"
                            >
                                <Translation id="FEE_LEVEL_ADVANCED" />
                            </Link>
                        )}
                    </Row>
                </Column>
            </CollapsibleBox>
        </FeesContext.Provider>
    );
}
