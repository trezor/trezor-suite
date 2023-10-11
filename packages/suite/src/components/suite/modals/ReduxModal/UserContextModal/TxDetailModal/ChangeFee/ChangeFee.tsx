import { ReactNode } from 'react';
import styled from 'styled-components';
import { Card, Icon, variables } from '@trezor/components';
import { Translation, FiatValue, FormattedCryptoAmount } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useRbf, RbfContext, UseRbfProps } from 'src/hooks/wallet/useRbfForm';
import { formatNetworkAmount, getFeeUnits } from '@suite-common/wallet-utils';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { RbfFees } from './RbfFees';
import { AffectedTransactions } from './AffectedTransactions';
import { DecreasedOutputs } from './DecreasedOutputs';
import { ReplaceTxButton } from './ReplaceTxButton';

const Wrapper = styled.div`
    margin: 12px 0;
`;

const Box = styled.div`
    display: flex;
    flex-direction: column;
    padding: 18px 26px;
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    border-radius: 8px;
`;

const Inner = styled.div`
    display: flex;
    & + & {
        border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
        margin-top: 28px;
        padding-top: 22px;
    }
`;

const Title = styled.div`
    width: 100px;
    padding-right: 20px;
    text-align: left;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Content = styled.div`
    flex: 1;
    text-align: left;
`;

const RateWrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
`;

const Rate = styled.div`
    margin: 1px 20px 0 0;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const Amount = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
    & * + * {
        margin-top: 6px;
    }
`;

const StyledCryptoAmount = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledFiatValue = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const FinalizeWarning = styled(Card)`
    display: flex;
    flex-direction: row;
    width: 100%;
    padding: 12px 0px;
    margin-top: 16px;
    text-align: center;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    background: ${({ theme }) => theme.BG_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const InfoIcon = styled(Icon)`
    margin-right: 8px;
`;

const Red = styled.span`
    margin-left: 2px;
    color: ${({ theme }) => theme.TYPE_RED};
    font-weight: ${variables.FONT_WEIGHT.BOLD};
`;

/* children are only for test purposes, this prop is not available in regular build */
interface ChangeFeeProps extends UseRbfProps {
    tx: WalletAccountTransaction;
    children?: ReactNode;
    showChained: () => void;
}

const ChangeFeeLoaded = (props: ChangeFeeProps) => {
    const contextValues = useRbf(props);
    const { tx, chainedTxs, showChained, finalize, children } = props;
    const { networkType } = contextValues.account;
    const feeRate =
        networkType === 'bitcoin' ? `${tx.rbfParams?.feeRate} ${getFeeUnits(networkType)}` : null;
    const fee = formatNetworkAmount(tx.fee, tx.symbol);

    return (
        <RbfContext.Provider value={contextValues}>
            <Wrapper>
                <Box>
                    <Inner>
                        <Title>
                            <Translation id="TR_CURRENT_FEE" />
                        </Title>
                        <Content>
                            <RateWrapper>
                                <Rate>{feeRate}</Rate>
                                <Amount>
                                    <StyledCryptoAmount>
                                        <FormattedCryptoAmount
                                            disableHiddenPlaceholder
                                            value={fee}
                                            symbol={tx.symbol}
                                        />
                                    </StyledCryptoAmount>
                                    <StyledFiatValue>
                                        <FiatValue
                                            disableHiddenPlaceholder
                                            amount={fee}
                                            symbol={tx.symbol}
                                        />
                                    </StyledFiatValue>
                                </Amount>
                            </RateWrapper>
                        </Content>
                    </Inner>
                    <Inner>
                        <RbfFees />
                    </Inner>
                    <DecreasedOutputs />
                    {chainedTxs.length > 0 && <AffectedTransactions showChained={showChained} />}
                </Box>
                {finalize && (
                    <FinalizeWarning>
                        <InfoIcon icon="INFO" size={16} />
                        <Translation
                            id="TR_FINALIZE_TS_RBF_OFF_WARN"
                            values={{ strong: chunks => <Red>{chunks}</Red> }}
                        />
                    </FinalizeWarning>
                )}
                <ReplaceTxButton finalize={finalize} />

                {children}
            </Wrapper>
        </RbfContext.Provider>
    );
};

export const ChangeFee = (props: Omit<ChangeFeeProps, 'selectedAccount' | 'rbfParams'>) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    if (selectedAccount.status !== 'loaded' || !props.tx.rbfParams) {
        return null;
    }
    return (
        <ChangeFeeLoaded
            selectedAccount={selectedAccount}
            rbfParams={props.tx.rbfParams}
            {...props}
        />
    );
};
