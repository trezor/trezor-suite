import { useState } from 'react';

import styled from 'styled-components';

import type { VerifiedNonce } from '@suite/desktop-app-api';
import { Translation } from '@suite/intl';
import { Button, Column, Paragraph, Row } from '@trezor/components';

const Hash = styled.span`
    word-break: break-all;
    font-variant-numeric: tabular-nums;
`;

type VerifiedNonceDetailsProps = {
    result: VerifiedNonce;
};

const formatBlockTime = (timestampSeconds: string) =>
    new Date(Number(timestampSeconds) * 1000).toISOString();

// The full record (including the raw proof bytes) is what `verify-record` re-verifies.
const toRecord = (result: VerifiedNonce) => JSON.stringify(result, null, 2);

export const VerifiedNonceDetails = ({ result }: VerifiedNonceDetailsProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const { evidence } = result;

    const copyRecord = async () => {
        await navigator.clipboard.writeText(toRecord(result));
        setIsCopied(true);
    };

    return (
        <Column gap={8}>
            <Row gap={8}>
                <Button
                    intent="neutral"
                    priority="secondary"
                    size="small"
                    onClick={() => setIsExpanded(!isExpanded)}
                    data-testid="@wallet/account-details/verified-nonce-details-toggle"
                >
                    <Translation
                        id={
                            isExpanded
                                ? 'TR_VERIFIED_NONCE_HIDE_DETAILS'
                                : 'TR_VERIFIED_NONCE_SHOW_DETAILS'
                        }
                    />
                </Button>
                <Button intent="neutral" priority="secondary" size="small" onClick={copyRecord}>
                    <Translation
                        id={
                            isCopied
                                ? 'TR_VERIFIED_NONCE_RECORD_COPIED'
                                : 'TR_VERIFIED_NONCE_COPY_RECORD'
                        }
                    />
                </Button>
            </Row>
            {isExpanded && (
                <Column gap={4} data-testid="@wallet/account-details/verified-nonce-details">
                    <Paragraph typographyStyle="body-xs">
                        <Translation
                            id="TR_VERIFIED_NONCE_DETAIL_BLOCK"
                            values={{
                                number: result.block.number,
                                time: formatBlockTime(result.block.timestampSeconds),
                            }}
                        />
                    </Paragraph>
                    <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                        <Translation
                            id="TR_VERIFIED_NONCE_DETAIL_BLOCK_HASH"
                            values={{ hash: <Hash>{result.block.hash}</Hash> }}
                        />
                    </Paragraph>
                    <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                        <Translation
                            id="TR_VERIFIED_NONCE_DETAIL_STATE_ROOT"
                            values={{ hash: <Hash>{evidence.header.stateRoot}</Hash> }}
                        />
                    </Paragraph>
                    <Paragraph typographyStyle="body-xs">
                        <Translation
                            id="TR_VERIFIED_NONCE_DETAIL_CONSENSUS"
                            values={{
                                slot: evidence.consensus.slot,
                                participants: evidence.consensus.syncCommitteeParticipants,
                                signedSlot: evidence.consensus.signedSlot,
                                period: evidence.consensus.syncCommitteePeriod,
                                proofType: evidence.consensus.headerProof,
                            }}
                        />
                    </Paragraph>
                    <Paragraph typographyStyle="body-xs">
                        <Translation
                            id="TR_VERIFIED_NONCE_DETAIL_TRUST"
                            values={{
                                policyId: evidence.trust.policyId,
                                policyVersion: evidence.trust.policyVersion,
                                epoch: evidence.trust.checkpointEpoch,
                            }}
                        />
                    </Paragraph>
                    <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                        <Translation
                            id="TR_VERIFIED_NONCE_DETAIL_CHECKPOINT_ROOT"
                            values={{ hash: <Hash>{evidence.trust.checkpointRoot}</Hash> }}
                        />
                    </Paragraph>
                    <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                        <Translation
                            id="TR_VERIFIED_NONCE_DETAIL_PROOF"
                            values={{
                                bytes: (evidence.proofHex.length - 2) / 2,
                                sha256: <Hash>{evidence.proofSha256}</Hash>,
                            }}
                        />
                    </Paragraph>
                    <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                        <Translation
                            id="TR_VERIFIED_NONCE_DETAIL_NETWORK"
                            values={{
                                prover: evidence.endpoints.prover ?? '—',
                                beacon: evidence.endpoints.beaconApi ?? '—',
                                requests: evidence.transfer.requestCount,
                                bytes: evidence.transfer.bytesReceived,
                                duration: evidence.transfer.durationMs,
                                mode: (
                                    <Translation
                                        id={
                                            evidence.transfer.isColdStart
                                                ? 'TR_VERIFIED_NONCE_COLD_START'
                                                : 'TR_VERIFIED_NONCE_WARM_START'
                                        }
                                    />
                                ),
                            }}
                        />
                    </Paragraph>
                    <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                        <Translation
                            id="TR_VERIFIED_NONCE_DETAIL_VERIFIER"
                            values={{ revision: result.verifier.revision }}
                        />
                    </Paragraph>
                    <Paragraph typographyStyle="body-xs">
                        <Translation
                            id="TR_VERIFIED_NONCE_HOW_TO_VERIFY"
                            values={{ blockNumber: result.block.number }}
                        />
                    </Paragraph>
                </Column>
            )}
        </Column>
    );
};
