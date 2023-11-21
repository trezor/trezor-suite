import styled from 'styled-components';
import { FeeLevel } from '@trezor/connect';
import {
    Control,
    FieldErrors,
    UseFormGetValues,
    UseFormRegister,
    UseFormReturn,
    UseFormSetValue,
} from 'react-hook-form';
import { SelectBar, variables } from '@trezor/components';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { useLayoutSize } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';
import { ExtendedMessageDescriptor } from 'src/types/suite';
import {
    FeeInfo,
    PrecomposedLevels,
    PrecomposedLevelsCardano,
    PrecomposedTransactionFinal,
} from 'src/types/wallet/sendForm';
import { CustomFee } from './CustomFee';
import { FeeDetails } from './FeeDetails';
import { FormState } from '@suite-common/wallet-types';

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

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        width: 100%;

        > div {
            width: 100%;
        }
    }

    ${variables.SCREEN_QUERY.MOBILE} {
        margin: 8px 0 20px;
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

const FeeInfoRow = styled.div`
    display: flex;
    width: 100%;
    min-height: 51px; /* reserve space for fiat/crypto amounts */
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
    flex-direction: column;
`;

const Label = styled.div<Pick<FeesProps<FormState>, 'rbfForm'>>`
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

export interface FeesProps<TFieldValues extends FormState> {
    account: Account;
    feeInfo: FeeInfo;
    register: UseFormRegister<TFieldValues>;
    control: Control<any>;
    setValue: UseFormSetValue<TFieldValues>;
    getValues: UseFormGetValues<TFieldValues>;
    errors: FieldErrors<TFieldValues>;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    changeFeeLimit?: (value: string) => void;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
    showLabel?: boolean;
    label?: ExtendedMessageDescriptor['id'];
    rbfForm?: boolean;
}

export const Fees = <TFieldValues extends FormState>({
    account: { symbol, networkType },
    feeInfo,
    control,
    changeFeeLevel,
    changeFeeLimit,
    composedLevels,
    showLabel,
    label,
    rbfForm,
    ...props
}: FeesProps<TFieldValues>) => {
    const { layoutSize } = useLayoutSize();
    const isDesktopLayout = layoutSize === 'XLARGE'; // we use slightly different layout on big screens (Fee label, selector and amount in one row)

    // Type assertion allowing to make the component reusable, see https://stackoverflow.com/a/73624072.
    const { getValues, register, setValue } = props as unknown as UseFormReturn<FormState>;
    const errors = props.errors as unknown as FieldErrors<FormState>;

    const selectedOption = getValues('selectedFee') || 'normal';
    const isCustomLevel = selectedOption === 'custom';

    const error = errors.selectedFee;
    const selectedLevel = feeInfo.levels.find(level => level.label === selectedOption)!;
    const transactionInfo = composedLevels?.[selectedOption];
    // Disable custom fees for solana, since the fee is deterministic
    const levels =
        symbol === 'sol' || symbol === 'dsol'
            ? feeInfo.levels.filter(l => l.label !== 'custom')
            : feeInfo.levels;
    const feeOptions = buildFeeOptions(levels);

    const labelComponent =
        showLabel || label ? (
            <Label rbfForm={rbfForm}>
                <Translation id={label || (networkType === 'ethereum' ? 'MAX_FEE' : 'FEE')} />
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
                <FeeInfoRow>
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

                    {error && <FeeError>{error.message}</FeeError>}
                </FeeInfoRow>

                {!isDesktopLayout && selectBarComponent}

                <FeeInfoWrapper>
                    {isCustomLevel ? (
                        <CustomFee
                            control={control}
                            networkType={networkType}
                            feeInfo={feeInfo}
                            errors={errors}
                            register={register}
                            getValues={getValues}
                            setValue={setValue}
                            changeFeeLimit={changeFeeLimit}
                            composedFeePerByte={
                                (transactionInfo as PrecomposedTransactionFinal)?.feePerByte
                            }
                        />
                    ) : (
                        <FeeDetails
                            networkType={networkType}
                            feeInfo={feeInfo}
                            selectedLevel={selectedLevel}
                            transactionInfo={transactionInfo}
                        />
                    )}
                </FeeInfoWrapper>
            </FeeSetupWrapper>
        </FeesWrapper>
    );
};
