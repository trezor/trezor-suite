import { Translation, type TranslationFunction, useTranslation } from '@suite/intl';
import { getFeeUnits, isInteger } from '@suite-common/wallet-utils';
import { Column, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { CurrentFee } from './CurrentFee';
import { CustomFeeEthereum } from './CustomFeeEthereum';
import { CustomFeeMisc } from './CustomFeeMisc';
import { CustomFeeTooLowBanner } from './CustomFeeTooLowBanner';
import { useFeesContext } from '../../context/FeesContext';

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
    const transactionInfo = selectedFeeLevel ? composedLevels?.[selectedFeeLevel.label] : null;
    const cachedBytes =
        transactionInfo && transactionInfo.type !== 'error' && transactionInfo.bytes;
    const shouldShowTxSize =
        networkType === 'bitcoin' && cachedBytes !== undefined && cachedBytes !== false;

    const { translationString } = useTranslation();
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

    return (
        <>
            <Column gap={spacings.xs}>
                <CustomFeeTooLowBanner />
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
                    <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                        <Translation id="TR_SIZE" />:
                    </Text>
                    <Text intent="neutral" typographyStyle="body-sm">
                        {cachedBytes} <Translation id="TR_BYTES" />
                    </Text>
                </Row>
            )}
        </>
    );
};
