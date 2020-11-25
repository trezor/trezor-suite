import React from 'react';
import styled from 'styled-components';
import { FeeLevel } from 'trezor-connect';
import { SelectBar, variables } from '@trezor/components';
import { FiatValue, FormattedCryptoAmount } from '@suite-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { getFeeUnits } from '@wallet-utils/sendFormUtils';
import { InputError } from '@wallet-components';
import EstimatedMiningTime from '@wallet-components/EstimatedMiningTime';
import CustomFee from './components/CustomFee';
import { Account } from '@wallet-types';
import { SendContextValues } from '@wallet-types/sendForm';

const FeeSetupWrapper = styled.div``;

const SelectBarWrapper = styled.div`
    display: flex; /* necessary for the <SelectBar> not to be stretched over full column width */
    margin: 0 20px 20px 0;
`;

const CoinAmount = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    padding-bottom: 6px;
`;

const FiatAmount = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const FeeInfo = styled.div`
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    min-width: 150px;
`;

const FeeUnits = styled.span`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const TxSize = styled(FeeUnits)`
    padding-left: 4px;
`;

const EstimatedMiningTimeWrapper = styled.span`
    padding-right: 4px;
`;

const FeesWrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
`;

const FeeAmount = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
    padding-top: 5px;
`;

const FeeError = styled(FeeAmount)`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_RED};
`;

const FeeInfoWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    height: 32px; /* prevent jumps when switching from/to custom fee  */
`;

interface Option {
    label: FeeLevel['label'];
    value: FeeLevel['label'];
}

const buildFeeOptions = (levels: FeeLevel[]) => {
    const result: Option[] = [];
    levels.forEach(level => {
        const { label } = level;
        result.push({ label, value: label });
    });
    return result;
};

export interface Props {
    account: Account;
    feeInfo: SendContextValues['feeInfo'];
    register: SendContextValues['register'];
    getValues: SendContextValues['getValues'];
    errors: SendContextValues['errors'];
    changeFeeLevel: (level: FeeLevel['label']) => void;
    changeFeePerUnit?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    changeFeeLimit?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    composedLevels: SendContextValues['composedLevels'];
}

const Fees = (props: Props) => {
    const {
        account: { symbol, networkType },
        feeInfo,
        getValues,
        errors,
        changeFeeLevel,
        composedLevels,
    } = props;

    const selectedOption = getValues('selectedFee') || 'normal';
    const error = errors.selectedFee;
    const selectedLevel = feeInfo.levels.find(level => level.label === selectedOption)!;
    const transactionInfo = composedLevels ? composedLevels[selectedOption] : undefined;
    const isCustomLevel = selectedOption === 'custom';
    const feeOptions = buildFeeOptions(feeInfo.levels);

    return (
        <FeesWrapper>
            <FeeSetupWrapper>
                <SelectBarWrapper>
                    <SelectBar
                        selectedOption={selectedOption}
                        options={feeOptions}
                        onChange={value => changeFeeLevel(value as Option['label'])}
                    />
                </SelectBarWrapper>

                <FeeInfoWrapper>
                    <FeeInfo>
                        {isCustomLevel && <CustomFee {...props} />}
                        {networkType === 'bitcoin' && !isCustomLevel && (
                            <EstimatedMiningTimeWrapper>
                                <EstimatedMiningTime
                                    seconds={feeInfo.blockTime * selectedLevel.blocks * 60}
                                />
                            </EstimatedMiningTimeWrapper>
                        )}
                        <FeeUnits>
                            {!isCustomLevel
                                ? `${selectedLevel.feePerUnit} ${getFeeUnits(networkType)}`
                                : ' '}
                        </FeeUnits>
                        {networkType === 'bitcoin' &&
                            !isCustomLevel &&
                            transactionInfo &&
                            transactionInfo.type !== 'error' && (
                                <TxSize>({transactionInfo.bytes} B)</TxSize>
                            )}
                    </FeeInfo>
                </FeeInfoWrapper>
            </FeeSetupWrapper>
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
        </FeesWrapper>
    );
};

export default Fees;
