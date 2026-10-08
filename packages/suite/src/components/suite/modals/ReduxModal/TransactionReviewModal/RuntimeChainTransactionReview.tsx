import { type ReactNode, useState } from 'react';

import { closeModal } from '@suite/modal';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { Badge, Banner, Column, Modal, Row, Text } from '@trezor/components';
import { convertAmountSubunitsToUnits } from '@trezor/network-module-suite-common-types';
import { type Deferred } from '@trezor/utils';

import { AccountLabeling } from 'src/components/suite/labeling/AccountLabeling';
import { useSelector } from 'src/hooks/suite';
import { type SendSession } from 'src/support/chainSend/SendSessionContext';
import { BlurUrls } from 'src/views/wallet/tokens/common/BlurUrls';

import { TransactionReviewModalConfirmOnDevice } from './TransactionReviewOutputList/TransactionReviewModalConfirmOnDevice';

// Runtime EVM networks are a debug feature; its texts are not translated yet.
const SOURCE_LABEL = { trezor: 'Trezor-listed', user: 'Added by you' } as const;

type ReviewRowProps = { label: string; children: ReactNode; 'data-testid'?: string };

const ReviewRow = ({ label, children, 'data-testid': dataTestId }: ReviewRowProps) => (
    <Row justifyContent="space-between" gap={16}>
        <Text typographyStyle="body-sm" priority="secondary">
            {label}
        </Text>
        <Text typographyStyle="body-sm" data-testid={dataTestId}>
            {children}
        </Text>
    </Row>
);

export type RuntimeChainTransactionReviewProps = {
    session: Extract<SendSession, { kind: 'runtime' }>;

    /** Set once signed: the user decides whether to broadcast. */
    decision: Deferred<boolean, string | number | undefined> | undefined;
    cancelSignTx: () => void;
};

/**
 * The review of a send on a runtime network. The wallet's review reads the app's network config,
 * which has no entry for a runtime network, so this one shows the network's definition instead:
 * the chain ID the device signs for, and who listed the network.
 */
export const RuntimeChainTransactionReview = ({
    session,
    decision,
    cancelSignTx,
}: RuntimeChainTransactionReviewProps) => {
    const { dispatch } = useServices(injectDispatch);
    const [isSending, setIsSending] = useState(false);
    const { runtime, precomposedForm, precomposedTx, serializedTx, preparedNonce } = session;
    const { network } = runtime;
    const walletAccount = useSelector(state => selectAccountByKey(state, runtime.walletAccountKey));

    const output = precomposedForm.outputs[0];
    const fee = convertAmountSubunitsToUnits(precomposedTx.fee, network.decimals);
    const feePerGas =
        'maxFeePerGas' in precomposedTx && precomposedTx.maxFeePerGas
            ? precomposedTx.maxFeePerGas
            : precomposedTx.feePerByte;

    const handleCancel = () => {
        dispatch(closeModal());
        cancelSignTx();
        decision?.resolve(false);
    };

    const handleSend = () => {
        setIsSending(true);
        decision?.resolve(true);
    };

    return (
        <Modal
            heading={`Send ${network.nativeSymbol} on ${network.name}`}
            onCancel={isSending ? undefined : handleCancel}
            data-testid="@runtime-chain-review"
            bottomContent={
                serializedTx && decision ? (
                    <Modal.Button
                        onClick={handleSend}
                        isLoading={isSending}
                        data-testid="@runtime-chain-review/send"
                    >
                        Send
                    </Modal.Button>
                ) : undefined
            }
        >
            <Column gap={12} alignItems="stretch">
                <TransactionReviewModalConfirmOnDevice
                    totalSteps={undefined}
                    serializedTx={serializedTx}
                    isSending={isSending}
                    reviewStep={0}
                    onCancel={handleCancel}
                />
                <Banner
                    intent={network.source === 'user' ? 'warning' : 'info'}
                    description={`Your Trezor shows chain ${network.chainId} as an unknown network. Check that the chain ID matches.`}
                />
                <ReviewRow label="Network">
                    <Row gap={8}>
                        <BlurUrls text={network.name} />
                        <Badge size="small">{SOURCE_LABEL[network.source]}</Badge>
                    </Row>
                </ReviewRow>
                <ReviewRow label="Chain ID" data-testid="@runtime-chain-review/chain-id">
                    {network.chainId}
                </ReviewRow>
                {walletAccount && (
                    <ReviewRow label="From">
                        <AccountLabeling account={walletAccount} />
                    </ReviewRow>
                )}
                <ReviewRow label="Recipient" data-testid="@runtime-chain-review/recipient">
                    {output?.address}
                </ReviewRow>
                <ReviewRow label="Amount" data-testid="@runtime-chain-review/amount">
                    {`${output?.amount ?? ''} ${network.nativeSymbol}`}
                </ReviewRow>
                <ReviewRow label="Max fee" data-testid="@runtime-chain-review/fee">
                    {`${fee} ${network.nativeSymbol}`}
                </ReviewRow>
                <ReviewRow label="Gas limit">{precomposedTx.feeLimit ?? ''}</ReviewRow>
                <ReviewRow label="Max fee per gas">{`${feePerGas} Gwei`}</ReviewRow>
                {preparedNonce && (
                    <ReviewRow label="Nonce" data-testid="@runtime-chain-review/nonce">
                        {preparedNonce}
                    </ReviewRow>
                )}
            </Column>
        </Modal>
    );
};
