import React from 'react';
import styled, { css } from 'styled-components';
import { FeeLevel } from 'trezor-connect';
import { AnimatePresence, motion } from 'framer-motion';
import { SelectBar, variables } from '@trezor/components';
import { FiatValue, FormattedCryptoAmount, Translation } from '@suite-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { useLayoutSize } from '@suite-hooks';
import { ANIMATION } from '@suite-config';
import { InputError } from '@wallet-components';
import FeeCustom from './components/FeeCustom';
import FeeDetails from './components/FeeDetails';
import { Props } from './definitions';

const FeeSetupWrapper = styled.div`
    width: 100%;
`;

const FeesWrapper = styled.div<{ desktop?: boolean }>`
    width: 100%;
    display: flex;
    flex-direction: ${props => (props.desktop ? 'row' : 'column')};
`;

const SelectBarWrapper = styled.div<{ desktop?: boolean }>`
    display: flex; /* necessary for the <SelectBar> not to be stretched over full column width */
    margin: 8px 20px 20px 0;

    ${props =>
        props.desktop &&
        css`
            margin: 0px;
        `}
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

const Row = styled.div`
    display: flex;
    width: 100%;
    /* justify-content: space-between; */
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
    color: ${props => props.theme.TYPE_RED};
    padding-top: 5px;
    width: 100%;
    text-align: right;
`;

const FeeInfoWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Label = styled.div<Pick<Props, 'rbfForm'>>`
    padding: ${props => (props.rbfForm ? '5px 60px 10px 0;' : '5px 20px 10px 0;')};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-transform: capitalize;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const buildFeeOptions = (levels: FeeLevel[]) =>
    levels.map(({ label }) => ({
        label,
        value: label,
    }));

const Fees = (props: Props) => {
    const {
        account: { symbol, networkType },
        feeInfo,
        getValues,
        errors,
        changeFeeLevel,
        composedLevels,
    } = props;
    const { layoutSize } = useLayoutSize();
    const selectedOption = getValues('selectedFee') || 'normal';
    const error = errors.selectedFee;
    const selectedLevel = feeInfo.levels.find(level => level.label === selectedOption)!;
    const transactionInfo = composedLevels ? composedLevels[selectedOption] : undefined;
    const isCustomLevel = selectedOption === 'custom';
    const feeOptions = buildFeeOptions(feeInfo.levels);
    const isDesktopLayout = layoutSize === 'XLARGE'; // we use slightly different layout on big screens (Fee label, selector and amount in one row)

    const labelComponent =
        props.showLabel || props.label ? (
            <Label rbfForm={props.rbfForm}>
                <Translation id={props.label ?? 'FEE'} />
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
                    {!isDesktopLayout && labelComponent}
                    {isDesktopLayout && selectBarComponent}

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
                            <motion.div style={{ width: '100%' }} {...ANIMATION.EXPAND}>
                                <FeeCustom {...props} />
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

export default Fees;
