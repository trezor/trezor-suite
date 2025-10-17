import { useFormContext } from 'react-hook-form';

import { FormState } from '@suite-common/wallet-types';
import { getFeeUnits, isInteger } from '@suite-common/wallet-utils';
import { Column, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { useTranslation } from 'src/hooks/suite';
import { TranslationFunction } from 'src/hooks/suite/useTranslation';

import { CurrentFee } from './CurrentFee';
import { CustomFeeEthereum } from './CustomFeeEthereum';
import { CustomFeeMisc } from './CustomFeeMisc';
import { CustomFeeTooLowBanner } from './CustomFeeTooLowBanner';
import { useFeesContext } from '../../context/FeesContext';

export const FEE_PER_UNIT = 'feePerUnit';
export const FEE_LIMIT = 'feeLimit';

export type CustomFeeBasicProps = {
    composedFeePerByte: string | undefined;
    translationString: TranslationFunction;
    feeUnits: string;
    sharedRules: {
        required: string;
        validate: (value: string) => string | undefined;
    };
};

type CustomFeeProps = {
    showCurrentFee: boolean;
};

export const CustomFee = ({ showCurrentFee }: CustomFeeProps) => {
    const { composedLevels, selectedFeeLevel, networkType } = useFeesContext();
    const transactionInfo = composedLevels?.[selectedFeeLevel.label];
    const { translationString } = useTranslation();
    const cachedBytes =
        transactionInfo && transactionInfo.type !== 'error' && transactionInfo.bytes;

    const sharedRules = {
        required: translationString('CUSTOM_FEE_IS_NOT_SET'),
        // Allow decimals in ETH since GWEI is not a satoshi.
        validate: (value: string) => {
            if (['bitcoin', 'ethereum'].includes(networkType) && !isInteger(value)) {
                return translationString('CUSTOM_FEE_IS_NOT_INTEGER');
            }
        },
    };

    const feeUnits = getFeeUnits(networkType);

    const { getValues } = useFormContext<FormState>();
    const feePerUnitValue = getValues(FEE_PER_UNIT);

    const shouldShowTxSize =
        networkType === 'bitcoin' && cachedBytes !== undefined && cachedBytes !== false;

    return (
        <>
            <Column gap={spacings.xs}>
                <CustomFeeTooLowBanner feePerUnitValue={feePerUnitValue} />
                {showCurrentFee && <CurrentFee />}
                {networkType === 'ethereum' ? (
                    <CustomFeeEthereum
                        feeUnits={feeUnits}
                        translationString={translationString}
                        sharedRules={sharedRules}
                    />
                ) : (
                    <CustomFeeMisc
                        composedFeePerByte={
                            transactionInfo?.type === 'final'
                                ? transactionInfo.feePerByte
                                : undefined
                        }
                        feeUnits={feeUnits}
                        translationString={translationString}
                        sharedRules={sharedRules}
                    />
                )}
            </Column>
            {shouldShowTxSize && (
                <Row alignItems="baseline" justifyContent="space-between">
                    <Text variant="tertiary" typographyStyle="hint">
                        <Translation id="TR_SIZE" />:
                    </Text>
                    <Text variant="default" typographyStyle="hint">
                        {cachedBytes} <Translation id="TR_BYTES" />
                    </Text>
                </Row>
            )}
        </>
    );
};
