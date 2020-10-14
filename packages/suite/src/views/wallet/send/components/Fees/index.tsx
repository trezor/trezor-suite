import React from 'react';
import styled from 'styled-components';
import { FeeLevel } from 'trezor-connect';
import { SelectBar, colors, variables } from '@trezor/components';
import { Card, Translation, FiatValue, FormattedCryptoAmount } from '@suite-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { getFeeUnits } from '@wallet-utils/sendFormUtils';
import EstimatedMiningTime from '@wallet-components/EstimatedMiningTime';
import CustomFee from './components/CustomFee';
import { useSendFormContext } from '@wallet-hooks';
import { useLayoutSize } from '@suite-hooks';

const StyledCard = styled(Card)`
    margin-bottom: 25px;
    padding: 32px 42px;
    display: flex;
    flex-direction: row;
    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const Label = styled.div`
    padding: 5px 20px 10px 0;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-transform: capitalize;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const FeeSetupWrapper = styled.div`
    width: 100%;
`;

const SelectBarWrapper = styled.div`
    display: flex; /* necessary for the <SelectBar> not to be stretched over full column width */
    margin-bottom: 20px;
`;

const CoinAmount = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
    padding-bottom: 6px;
`;

const FiatAmount = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const FeeInfo = styled.div`
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    min-width: 150px;
`;

const FeeUnits = styled.span`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const TxSize = styled(FeeUnits)`
    padding-left: 4px;
`;

const EstimatedMiningTimeWrapper = styled.span`
    padding-right: 4px;
`;

const FeeAmount = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
    padding-top: 5px;
    width: 100%; /* stretch to all available width so that the Fee amount is aligned all the way to the right */
`;

const FeeInfoWrapper = styled.div`
    display: flex;
`;

interface Option {
    label: string;
    value: string;
}

const buildFeeOptions = (levels: FeeLevel[]) => {
    const result: Option[] = [];
    levels.forEach(level => {
        const { label } = level;
        result.push({ label, value: label });
    });
    return result;
};

// Compute if mobile layout should be used.
// The mobile layout is displayed based on the screen size and the size (=number of options) of <SelectBar>
const getIfMobileLayout = (selectBarOptionsCount: number, layoutSize: string) => {
    if (layoutSize === 'TINY') {
        return true;
    }
    if (selectBarOptionsCount >= 4 && (layoutSize === 'NORMAL' || layoutSize === 'SMALL')) {
        return true;
    }
    return false;
};

const Fees = () => {
    const {
        feeInfo,
        changeFeeLevel,
        account: { symbol, networkType },
        getDefaultValue,
        composedLevels,
        composeTransaction,
    } = useSendFormContext();

    const selectedLabel = getDefaultValue('selectedFee') || 'normal';
    const selectedLevel = feeInfo.levels.find(level => level.label === selectedLabel)!;
    const transactionInfo = composedLevels ? composedLevels[selectedLabel] : undefined;
    const isCustomLevel = selectedLabel === 'custom';
    const feeOptions = buildFeeOptions(feeInfo.levels);
    const { layoutSize } = useLayoutSize();
    const useMobileLayout = getIfMobileLayout(feeOptions.length, layoutSize);

    // declare feeAmountJSX code before rendering since we will use it at two different locations based on the layout setup (useMobileLayout?)
    const feeAmountJSX =
        transactionInfo !== undefined && transactionInfo.type !== 'error' ? (
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
        ) : null;

    return (
        <StyledCard>
            <Label>
                <Translation id="FEE" />
            </Label>

            <FeeSetupWrapper>
                <SelectBarWrapper>
                    <SelectBar
                        selectedOption={selectedLabel}
                        options={feeOptions}
                        onChange={value => {
                            // changeFeeLevel will decide if composeTransaction in needed or not
                            const shouldCompose = changeFeeLevel(
                                selectedLevel,
                                feeInfo.levels.find(level => level.label === value)!,
                            );
                            if (shouldCompose) composeTransaction();
                        }}
                    />
                </SelectBarWrapper>

                <FeeInfoWrapper>
                    <FeeInfo>
                        {isCustomLevel && <CustomFee />}
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
                    {useMobileLayout && feeAmountJSX}
                </FeeInfoWrapper>
            </FeeSetupWrapper>
            {!useMobileLayout && feeAmountJSX}
        </StyledCard>
    );
};

export default Fees;
