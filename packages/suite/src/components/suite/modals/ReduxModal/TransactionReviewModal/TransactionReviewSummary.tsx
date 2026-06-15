import { useEffect, useState } from 'react';

import { AccountLabel } from '@suite/account';
import { Translation } from '@suite/intl';
import { selectIsDebugModeActive } from '@suite/settings';
import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { formatDurationStrict } from '@suite-common/suite-utils';
import { type NetworkType, networks } from '@suite-common/wallet-config';
import { selectPrecomposedSendForm, selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import { ethereumGetCurrentNonceThunk } from '@suite-common/wallet-core/src/send/sendFormEthereumThunks';
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

import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { DebugOnlyBadge } from 'src/components/suite/DebugOnlyBadge';
import { useDispatch, useLocales } from 'src/hooks/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { type Account } from 'src/types/wallet';

import { TransactionReviewTronFeeNotes } from './TransactionReviewTronFeeNotes';

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

    const dispatch = useDispatch();
    const [resolvedNonce, setResolvedNonce] = useState<string>();

    const isEthereumNetworkType = networkType === 'ethereum';
    // Read from the precomposed form actually being signed — not the draft, which the RBF
    // (bump-fee / cancel) flow does not populate, so its rbfParams/nonce would be missing.
    const precomposedForm = useSelector(selectPrecomposedSendForm);
    const rbfParams = precomposedForm?.rbfParams;
    // A custom nonce set in the send form takes precedence over the auto-resolved value.
    const nonceOverride = precomposedForm?.ethereumNonce?.trim();

    useEffect(() => {
        if (!isEthereumNetworkType) return;

        // Nonce is resolved at signing time, so we replicate that resolution here to show
        // the user the exact nonce that will be used for the transaction they are reviewing.
        const promise = dispatch(
            ethereumGetCurrentNonceThunk({
                selectedAccount: account as Account & { networkType: 'ethereum' },
                rbfParams,
            }),
        );

        void promise
            .unwrap()
            .then(result => setResolvedNonce(result.nonce))
            .catch(() => {});

        return () => {
            promise.abort();
        };
    }, [account, dispatch, isEthereumNetworkType, rbfParams]);

    const ethereumNonce = nonceOverride || resolvedNonce;

    return (
        <>
            <Row justifyContent="space-between">
                <Row columnGap={spacings.md} rowGap={spacings.xxs} flexWrap="wrap">
                    <Row gap={spacings.xxs}>
                        <CoinLogo size={16} symbol={symbol} />
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
                            {ethereumNonce !== undefined && (
                                <Note data-testid="@modal/ethereum/nonce" iconName="receipt">
                                    <Translation id="TR_NONCE" />
                                    {': '}
                                    {ethereumNonce}
                                </Note>
                            )}
                        </>
                    )}

                    {!['ethereum', 'solana', 'tron'].includes(networkType) && (
                        <Note iconName="receipt">
                            <FeeRate feeRate={fee} networkType={network.networkType} />
                        </Note>
                    )}

                    {networkType === 'tron' && (
                        <TransactionReviewTronFeeNotes tx={tx} account={account} />
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
                                tooltip={{
                                    content: <Translation id="TR_TRANSACTION_DETAILS" />,
                                }}
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
