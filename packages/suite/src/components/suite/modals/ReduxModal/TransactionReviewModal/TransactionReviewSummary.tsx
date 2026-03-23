import { Translation } from '@suite/intl';
import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { formatDurationStrict } from '@suite-common/suite-utils';
import { type NetworkType, networks } from '@suite-common/wallet-config';
import { selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import {
    type FeeInfo,
    type GeneralPrecomposedTransactionFinal,
    type SendFormDraftKey,
    type StakeType,
} from '@suite-common/wallet-types';
import {
    asAmountUnit,
    getFee,
    hasEip1559MaxPriorityFee,
    isEip1559,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { Box, IconButton, Note, Row, Text } from '@trezor/components';
import { CoinLogo, FeeRate } from '@trezor/product-components';
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { AccountLabel } from 'src/components/suite/AccountLabel';
import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { DebugOnlyBadge } from 'src/components/suite/DebugOnlyBadge';
import { useLocales } from 'src/hooks/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectIsDebugModeActive } from 'src/selectors/suite/suiteSelectors';
import { type Account } from 'src/types/wallet';

const getEstimatedTime = (
    networkType: NetworkType,
    feeInfo: FeeInfo | undefined,
    tx: GeneralPrecomposedTransactionFinal,
): number | undefined => {
    if (!feeInfo) return;

    const matchedFeeLevel = feeInfo.levels.find(item => item.feePerUnit === tx.feePerByte);

    // TODO: estimated EVM time, blocks logic in connect
    if (networkType !== 'bitcoin' || !matchedFeeLevel) return;

    return matchedFeeLevel.blocks * feeInfo.blockTime * 60;
};

type TransactionReviewSummaryProps = {
    tx: GeneralPrecomposedTransactionFinal;
    account: Account;
    broadcast?: boolean;
    onDetailsClick: () => void;
    stakeType?: StakeType | null;
    timer?: React.JSX.Element;
};

export const TransactionReviewSummary = ({
    tx,
    account,
    broadcast,
    onDetailsClick,
    stakeType,
    timer,
}: TransactionReviewSummaryProps) => {
    const drafts = useSelector(state => state.wallet.send.drafts);
    const currentAccountKey = useSelector(
        state => state.wallet.selectedAccount.account?.key,
    ) as string;
    const rawFeeInfo = useSelector(state => selectRawNetworkFeeInfo(state, account.symbol));
    const locale = useLocales();
    const { symbol, networkType } = account;
    const network = networks[symbol];
    const fee = getFee(account.networkType, tx);
    const estimateTime = getEstimatedTime(networkType, rawFeeInfo, tx);
    const connectPopupCall = useSelector(selectConnectPopupCall);
    const isDebug = useSelector(selectIsDebugModeActive);

    const formFeeRate = drafts[currentAccountKey as SendFormDraftKey]?.feePerUnit; // Todo: is this cast correct? https://github.com/trezor/trezor-suite/issues/24918
    const isFeeCustom = drafts[currentAccountKey as SendFormDraftKey]?.selectedFee === 'custom'; // Todo: is this cast correct? https://github.com/trezor/trezor-suite/issues/24918
    const isComposedFeeRateDifferent = isFeeCustom && formFeeRate !== fee;

    const isEthereumNetworkType = networkType === 'ethereum';

    return (
        <>
            <Row justifyContent="space-between">
                <Row columnGap={spacings.md} rowGap={spacings.xxs} flexWrap="wrap">
                    <Row gap={spacings.xxs}>
                        <CoinLogo size={14} symbol={symbol} />
                        <AccountLabel
                            account={account}
                            showAccountTypeBadge
                            accountTypeBadgeSize="small"
                        />
                    </Row>

                    {estimateTime !== undefined && (
                        <Note iconName="clock">
                            {'≈ '}
                            {formatDurationStrict(estimateTime, locale)}
                        </Note>
                    )}

                    {isEthereumNetworkType && (
                        <>
                            <Note data-testid="@modal/ethereum/gas-limit" iconName="gasPump">
                                <Translation id="TR_GAS_LIMIT" />
                                {': '}
                                {tx.feeLimit}
                            </Note>
                            <Note data-testid="@modal/ethereum/fee" iconName="gasPump">
                                {isEip1559(tx) ? (
                                    <Translation id="TR_MAX_FEE_PER_GAS" />
                                ) : (
                                    <Translation id="TR_GAS_PRICE" />
                                )}
                                {': '}
                                <FeeRate feeRate={fee} networkType={network.networkType} />
                            </Note>
                            {hasEip1559MaxPriorityFee(tx) ? (
                                <Note data-testid="@modal/ethereum/priority-fee" iconName="gasPump">
                                    <Translation id="TR_MAX_PRIORITY_FEE_PER_GAS" />

                                    {': '}
                                    <FeeRate
                                        feeRate={tx.maxPriorityFeePerGas}
                                        networkType={network.networkType}
                                    />
                                </Note>
                            ) : undefined}
                        </>
                    )}

                    {!['ethereum', 'solana'].includes(networkType) && (
                        <Note iconName="receipt">
                            <FeeRate feeRate={fee} networkType={network.networkType} />
                        </Note>
                    )}

                    {isComposedFeeRateDifferent && network.networkType === 'bitcoin' && (
                        <Translation id="TR_FEE_RATE_CHANGED" />
                    )}

                    {!stakeType && !broadcast && connectPopupCall?.state !== 'ongoing' && (
                        <Note iconName="broadcast">
                            <Translation id="BROADCAST" />
                            {': '}
                            <Text intent="critical">
                                <Translation id="TR_OFF" />
                            </Text>
                        </Note>
                    )}

                    {connectPopupCall?.state === 'ongoing' && <ConnectCallSource />}

                    {tx.inputs.length > 0 && (
                        // TODO: IconButton doesn't take margin even though it should
                        <Box margin={{ left: 'auto' }}>
                            <IconButton
                                onClick={() => onDetailsClick()}
                                intent="neutral"
                                priority="secondary"
                                icon="info"
                            />
                        </Box>
                    )}
                </Row>
                {timer}
            </Row>
            {networkType === 'solana' && isDebug && (
                <Row margin={{ top: spacings.xs }} gap={spacings.xs}>
                    <DebugOnlyBadge />
                    <Note iconName="computerTower">
                        CU Limit
                        {': '}
                        {tx.feeLimit} CU
                    </Note>
                    <Note iconName="computerTower">
                        CU Price
                        {': '}
                        <FeeRate
                            feeRate={unitsToSubunits({
                                value: asAmountUnit(new BigNumber(tx.feePerByte)),
                                decimals: -6,
                            })}
                            networkType={network.networkType}
                        />
                        /CU
                    </Note>
                </Row>
            )}
        </>
    );
};
