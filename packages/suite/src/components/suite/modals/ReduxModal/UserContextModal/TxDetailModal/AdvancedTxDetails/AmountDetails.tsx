import styled from 'styled-components';
import { variables } from '@trezor/components';
import { Translation, FormattedCryptoAmount, FiatValue, FormattedDate } from 'src/components/suite';
import { AmountRow } from './AmountRow';
import { NetworkSymbol, WalletAccountTransaction } from 'src/types/wallet';
import {
    formatAmount,
    formatCardanoDeposit,
    formatCardanoWithdrawal,
    formatNetworkAmount,
    getFiatRateKey,
    getTxOperation,
    isNftTokenTransfer,
    isTxFeePaid,
    roundTimestampToNearestPastHour,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { FormattedNftAmount } from 'src/components/suite/FormattedNftAmount';
import { useSelector } from 'src/hooks/suite';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import {
    selectHistoricFiatRates,
    selectHistoricFiatRatesByTimestamp,
} from '@suite-common/wallet-core';
import { Timestamp, TokenAddress } from '@suite-common/wallet-types';
import { isStakeTypeTx } from '@suite-common/suite-utils';

const MainContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

const AmountWrapper = styled.div`
    display: grid;
    grid-gap: 5px;

    /* columns: 1. title, 2. crypto amount, 3. fiat amount old, 4. fiat amount now */
    grid-template-columns: 140px minmax(110px, auto) minmax(100px, auto) minmax(100px, auto);

    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    align-items: center;
    overflow: visible;
    word-break: break-all;

    ${variables.SCREEN_QUERY.MOBILE} {
        /* decrease the width of the first (title) column on small screen */
        grid-template-columns: 90px minmax(110px, auto) minmax(100px, auto) minmax(100px, auto);
        overflow-x: auto;
    }
`;

interface AmountDetailsProps {
    tx: WalletAccountTransaction;
    isTestnet: boolean;
}

// TODO: Do not show FEE for sent but not mine transactions
export const AmountDetails = ({ tx, isTestnet }: AmountDetailsProps) => {
    const fiatCurrencyCode = useSelector(selectLocalCurrency);
    const fiatRateKey = getFiatRateKey(tx.symbol, fiatCurrencyCode);

    const historicRate = useSelector(state =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, tx.blockTime as Timestamp),
    );

    const historicFiatRates = useSelector(selectHistoricFiatRates);

    const amount = new BigNumber(formatNetworkAmount(tx.amount, tx.symbol));
    const fee = formatNetworkAmount(tx.fee, tx.symbol);
    const cardanoWithdrawal = formatCardanoWithdrawal(tx);
    const cardanoDeposit = formatCardanoDeposit(tx);
    const { selectedAccount } = useSelector(state => state.wallet);

    const txSignature = tx.ethereumSpecific?.parsedData?.methodId;
    const isStakeTypeTxNoAmount = isStakeTypeTx(txSignature) && amount.eq(0);

    return (
        <MainContainer>
            <AmountWrapper>
                {/* ROW CONTAINING DATES FOR FIAT VALUES */}
                {!isTestnet && (
                    <AmountRow
                        // keep the first two columns empty for the first row
                        thirdColumn={
                            tx.blockTime && (
                                <FormattedDate value={new Date(tx.blockTime * 1000)} date />
                            )
                        }
                        fourthColumn={
                            <Translation
                                id="TR_TODAY_DATE"
                                values={{
                                    date: (
                                        <FiatValue amount="1" symbol={tx.symbol}>
                                            {({ timestamp }) =>
                                                timestamp ? (
                                                    <FormattedDate
                                                        value={timestamp}
                                                        date
                                                        year={undefined}
                                                    />
                                                ) : null
                                            }
                                        </FiatValue>
                                    ),
                                }}
                            />
                        }
                    />
                )}
                {/* AMOUNT */}
                {!isStakeTypeTxNoAmount && (tx.targets.length || tx.type === 'joint') && (
                    <AmountRow
                        firstColumn={<Translation id="AMOUNT" />}
                        secondColumn={
                            <FormattedCryptoAmount
                                value={amount.abs().toString()}
                                symbol={tx.symbol}
                                signValue={
                                    getTxOperation(tx.type, true) ||
                                    (amount.isLessThan(0) ? 'negative' : 'positive')
                                }
                            />
                        }
                        thirdColumn={
                            <FiatValue
                                amount={amount.abs().toString()}
                                symbol={tx.symbol}
                                historicRate={historicRate}
                                useHistoricRate
                            />
                        }
                        fourthColumn={
                            <FiatValue amount={amount.abs().toString()} symbol={tx.symbol} />
                        }
                    />
                )}
                {cardanoWithdrawal && (
                    <AmountRow
                        firstColumn={<Translation id="TR_TX_WITHDRAWAL" />}
                        secondColumn={
                            <FormattedCryptoAmount
                                value={cardanoWithdrawal}
                                symbol={tx.symbol}
                                signValue="negative"
                            />
                        }
                        thirdColumn={
                            <FiatValue
                                amount={cardanoWithdrawal}
                                symbol={tx.symbol}
                                historicRate={historicRate}
                                useHistoricRate
                            />
                        }
                        fourthColumn={<FiatValue amount={cardanoWithdrawal} symbol={tx.symbol} />}
                    />
                )}
                {cardanoDeposit && (
                    <AmountRow
                        firstColumn={<Translation id="TR_TX_DEPOSIT" />}
                        secondColumn={
                            <FormattedCryptoAmount
                                value={cardanoDeposit}
                                symbol={tx.symbol}
                                signValue="positive"
                            />
                        }
                        thirdColumn={
                            <FiatValue
                                amount={cardanoDeposit}
                                symbol={tx.symbol}
                                historicRate={historicRate}
                                useHistoricRate
                            />
                        }
                        fourthColumn={<FiatValue amount={cardanoDeposit} symbol={tx.symbol} />}
                    />
                )}
                {tx.internalTransfers.map((transfer, i) => (
                    <AmountRow
                        key={i}
                        firstColumn={
                            i === 0 && (!tx.targets.length || isStakeTypeTxNoAmount) ? (
                                <Translation id="AMOUNT" />
                            ) : undefined
                        }
                        secondColumn={
                            <FormattedCryptoAmount
                                value={formatNetworkAmount(transfer.amount, tx.symbol)}
                                symbol={tx.symbol}
                                signValue={getTxOperation(transfer.type, true)}
                            />
                        }
                        thirdColumn={
                            <FiatValue
                                amount={formatNetworkAmount(transfer.amount, tx.symbol)}
                                symbol={tx.symbol}
                                historicRate={historicRate}
                                useHistoricRate
                            />
                        }
                        fourthColumn={
                            <FiatValue
                                amount={formatNetworkAmount(transfer.amount, tx.symbol)}
                                symbol={tx.symbol}
                            />
                        }
                    />
                ))}
                {tx.tokens.map((transfer, i) => {
                    const tokenFiatRateKey = getFiatRateKey(
                        tx.symbol,
                        fiatCurrencyCode,
                        transfer.contract as TokenAddress,
                    );
                    const roundedTimestamp = roundTimestampToNearestPastHour(
                        tx.blockTime as Timestamp,
                    );
                    const historicTokenRate =
                        historicFiatRates?.[tokenFiatRateKey]?.[roundedTimestamp];

                    return (
                        <AmountRow
                            key={i}
                            firstColumn={
                                !tx.targets.length && !tx.internalTransfers.length && i === 0 ? (
                                    <Translation id="AMOUNT" />
                                ) : undefined
                            }
                            secondColumn={
                                isNftTokenTransfer(transfer) ? (
                                    <FormattedNftAmount
                                        transfer={transfer}
                                        isWithLink
                                        signValue={getTxOperation(transfer.type, true)}
                                    />
                                ) : (
                                    <FormattedCryptoAmount
                                        value={formatAmount(transfer.amount, transfer.decimals)}
                                        symbol={transfer.symbol as NetworkSymbol}
                                        signValue={getTxOperation(transfer.type, true)}
                                    />
                                )
                            }
                            thirdColumn={
                                <FiatValue
                                    amount={formatAmount(transfer.amount, transfer.decimals)}
                                    symbol={transfer.symbol}
                                    historicRate={historicTokenRate}
                                    useHistoricRate
                                />
                            }
                            fourthColumn={
                                <FiatValue
                                    amount={formatAmount(transfer.amount, transfer.decimals)}
                                    symbol={selectedAccount.account?.symbol as NetworkSymbol}
                                    tokenAddress={transfer.contract as TokenAddress}
                                />
                            }
                        />
                    );
                })}
                {/* TX FEE */}
                {isTxFeePaid(tx) && (
                    <AmountRow
                        firstColumn={<Translation id="TR_TX_FEE" />}
                        secondColumn={
                            <FormattedCryptoAmount
                                value={fee}
                                symbol={tx.symbol}
                                signValue="negative"
                            />
                        }
                        thirdColumn={
                            <FiatValue
                                amount={fee}
                                symbol={tx.symbol}
                                historicRate={historicRate}
                                useHistoricRate
                            />
                        }
                        fourthColumn={<FiatValue amount={fee} symbol={tx.symbol} />}
                    />
                )}
            </AmountWrapper>
        </MainContainer>
    );
};
