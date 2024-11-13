import { useEffect, useMemo, useRef } from 'react';

import { Button, Paragraph, Tooltip, Card, Column, InfoRow } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { getAccountEverstakeStakingPool, isPending } from '@suite-common/wallet-utils';
import { selectAccountClaimTransactions } from '@suite-common/wallet-core';
import { notificationsActions } from '@suite-common/toast-notifications';

import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

export const ClaimCard = () => {
    const selectedAccount = useSelector(selectSelectedAccount);
    const claimTxs = useSelector(state =>
        selectAccountClaimTransactions(state, selectedAccount?.key || ''),
    );
    const { isClaimingDisabled, claimingMessageContent } = useMessageSystemStaking();

    const isClaimPending = useMemo(() => claimTxs.some(tx => isPending(tx)), [claimTxs]);

    const { canClaim = false, claimableAmount = '0' } =
        getAccountEverstakeStakingPool(selectedAccount) ?? {};

    // Show success message when claim tx confirmation is complete.
    const prevIsClaimPending = useRef(false);
    const dispatch = useDispatch();

    useEffect(() => {
        // Reset prevIsClaimPending when account changes
        prevIsClaimPending.current = false;
    }, [selectedAccount?.key]);

    useEffect(() => {
        if (prevIsClaimPending.current && !isClaimPending) {
            dispatch(
                notificationsActions.addToast({
                    type: 'successful-claim',
                    symbol: selectedAccount?.symbol.toUpperCase() || '',
                }),
            );
            prevIsClaimPending.current = false;
        }

        prevIsClaimPending.current = isClaimPending;
    }, [dispatch, isClaimPending, selectedAccount?.symbol, selectedAccount?.key]);

    const openClaimModal = () => {
        if (!isClaimingDisabled) {
            dispatch(openModal({ type: 'claim' }));
        }
    };

    if (!canClaim || !selectedAccount?.symbol) return null;

    const content = (
        <>
            <Paragraph typographyStyle="titleSmall" variant="primary">
                <FormattedCryptoAmount value={claimableAmount} symbol={selectedAccount?.symbol} />
            </Paragraph>
            <Paragraph typographyStyle="hint" variant="tertiary">
                <FiatValue
                    showApproximationIndicator
                    amount={claimableAmount}
                    symbol={selectedAccount?.symbol}
                />
            </Paragraph>
        </>
    );

    return isClaimPending ? (
        <Card>
            <InfoRow label={<Translation id="TR_STAKE_CLAIM_PENDING" />} iconName="spinnerGap">
                {content}
            </InfoRow>
        </Card>
    ) : (
        <Card isHiglighted>
            <Column flex="1" alignItems="normal" gap={spacings.xl}>
                <InfoRow
                    label={<Translation id="TR_STAKE_UNSTAKED_AND_READY_TO_CLAIM" />}
                    iconName="confirmation"
                >
                    {content}
                </InfoRow>
                <InfoRow label={<Translation id="TR_STAKE_TIME_TO_CLAIM" />} iconName="lightning">
                    <Paragraph typographyStyle="titleSmall">
                        <Translation id="TR_STAKE_INSTANT" />
                    </Paragraph>
                </InfoRow>

                <Tooltip content={claimingMessageContent}>
                    <Button
                        onClick={openClaimModal}
                        isDisabled={isClaimingDisabled}
                        icon={isClaimingDisabled ? 'info' : undefined}
                    >
                        <Translation id="TR_STAKE_CLAIM" />
                    </Button>
                </Tooltip>
            </Column>
        </Card>
    );
};
