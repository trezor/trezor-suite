import React from 'react';
import styled from 'styled-components';
import { FeeLevel } from '@trezor/connect';
import { UseFormMethods } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import { SelectBar, variables, motionAnimation } from '@trezor/components';
import { FiatValue, FormattedCryptoAmount, Translation } from '@suite-components';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { useLayoutSize } from '@suite-hooks';
import { InputError } from '@wallet-components';
import { Account } from '@wallet-types';
import { ExtendedMessageDescriptor } from '@suite-types';
import { FeeInfo, PrecomposedLevels, PrecomposedLevelsCardano } from '@wallet-types/sendForm';
import { TypedValidationRules } from '@wallet-types/form';
import { CustomFee } from './components/CustomFee';
import FeeDetails from './components/FeeDetails';

const FeeSetupWrapper = styled.div`
    width: 100%;
`;

const FeesWrapper = styled.div<{ desktop?: boolean }>`
    width: 100%;
    display: flex;
    flex-direction: ${({ desktop }) => (desktop ? 'row' : 'column')};
`;

const SelectBarWrapper = styled.div<{ desktop?: boolean }>`
    display: flex; /* necessary for the <SelectBar> not to be stretched over full column width */
    margin: ${({ desktop }) => (desktop ? '0px' : '8px 20px 20px 0')};

    ${variables.SCREEN_QUERY.MOBILE} {
        margin: 8px 0px 20px;
    }
`;

const CoinAmount = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    padding-bottom: 6px;
`;

const FiatAmount = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const Row = styled.div`
    display: flex;
    width: 100%;
    min-height: 56px; /* reserve space for fiat/crypto amounts */
`;

const FeeAmount = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding-top: 5px;
    margin-left: auto;
`;

const FeeError = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_RED};
    padding-top: 5px;
    width: 100%;
    text-align: right;
`;

const FeeInfoWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Label = styled.div<Pick<FeesProps, 'rbfForm'>>`
    padding: ${({ rbfForm }) => (rbfForm ? '5px 60px 10px 0;' : '5px 20px 10px 0;')};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-transform: capitalize;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

const FEE_LEVELS_TRANSLATIONS = {
    custom: 'FEE_LEVEL_CUSTOM',
    high: 'FEE_LEVEL_HIGH',
    normal: 'FEE_LEVEL_NORMAL',
    economy: 'FEE_LEVEL_ECONOMY',
    low: 'FEE_LEVEL_LOW',
} as const;

const buildFeeOptions = (levels: FeeLevel[]) =>
    levels.map(({ label }) => ({
        label: <Translation id={FEE_LEVELS_TRANSLATIONS[label]} />,
        value: label,
    }));

type FormMethods = UseFormMethods<{
    selectedFee?: FeeLevel['label'];
    feePerUnit?: string;
    feeLimit?: string;
    estimatedFeeLimit?: string;
}>;

export interface FeesProps {
    account: Account;
    feeInfo: FeeInfo;
    register: (rules?: TypedValidationRules) => (ref: any) => void;
    setValue: FormMethods['setValue'];
    getValues: FormMethods['getValues'];
    errors: FormMethods['errors'];
    changeFeeLevel: (level: FeeLevel['label']) => void;
    changeFeeLimit?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
    showLabel?: boolean;
    label?: ExtendedMessageDescriptor['id'];
    rbfForm?: boolean;
}

export const Fees = ({
    account: { symbol, networkType },
    feeInfo,
    register,
    setValue,
    getValues,
    errors,
    changeFeeLevel,
    changeFeeLimit,
    composedLevels,
    showLabel,
    label,
    rbfForm,
}: FeesProps) => {
    const { layoutSize } = useLayoutSize();
    const isDesktopLayout = layoutSize === 'XLARGE'; // we use slightly different layout on big screens (Fee label, selector and amount in one row)

    const selectedOption = getValues('selectedFee') || 'normal';
    const isCustomLevel = selectedOption === 'custom';

    const error = errors.selectedFee;
    const selectedLevel = feeInfo.levels.find(level => level.label === selectedOption)!;
    const transactionInfo = composedLevels?.[selectedOption];
    const feeOptions = buildFeeOptions(feeInfo.levels);

    const labelComponent =
        showLabel || label ? (
            <Label rbfForm={rbfForm}>
                <Translation id={label ?? 'FEE'} />
            </Label>
        ) : null;

    const selectBarComponent = (
        <SelectBarWrapper desktop={isDesktopLayout}>
            <SelectBar
                selectedOption={selectedOption}
                options={feeOptions}
                onChange={changeFeeLevel}
            />
        </SelectBarWrapper>
    );

    return (
        <FeesWrapper desktop={isDesktopLayout}>
            {/* Only 2 components are changing positions based on layout, Label and SelectBar */}
            {isDesktopLayout && labelComponent}

            <FeeSetupWrapper>
                <Row>
                    {isDesktopLayout ? selectBarComponent : labelComponent}

                    {transactionInfo !== undefined && transactionInfo.type !== 'error' && (
                        <FeeAmount>
                            <CoinAmount>
                                <FormattedCryptoAmount
                                    disableHiddenPlaceholder
                                    value={formatNetworkAmount(transactionInfo.fee, symbol)}
                                    symbol={symbol}
                                />
                            </CoinAmount>

                            <FiatAmount>
                                <FiatValue
                                    disableHiddenPlaceholder
                                    amount={formatNetworkAmount(transactionInfo.fee, symbol)}
                                    symbol={symbol}
                                />
                            </FiatAmount>
                        </FeeAmount>
                    )}

                    {error && (
                        <FeeError>
                            <InputError error={error} />
                        </FeeError>
                    )}
                </Row>

                {!isDesktopLayout && selectBarComponent}

                <FeeInfoWrapper>
                    <AnimatePresence initial={false}>
                        {isCustomLevel ? (
                            <motion.div style={{ width: '100%' }} {...motionAnimation.expand}>
                                <CustomFee
                                    networkType={networkType}
                                    feeInfo={feeInfo}
                                    errors={errors}
                                    register={register}
                                    getValues={getValues}
                                    setValue={setValue}
                                    changeFeeLimit={changeFeeLimit}
                                />
                            </motion.div>
                        ) : (
                            <FeeDetails
                                networkType={networkType}
                                feeInfo={feeInfo}
                                selectedLevel={selectedLevel}
                                transactionInfo={transactionInfo}
                            />
                        )}
                    </AnimatePresence>
                </FeeInfoWrapper>
            </FeeSetupWrapper>
        </FeesWrapper>
    );
};
