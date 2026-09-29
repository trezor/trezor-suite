import { useEffect, useState } from 'react';

import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { useEvmNonceInfo } from '@suite-common/wallet-core';
import { type AccountWithNetworkType } from '@suite-common/wallet-types';
import { Badge, Button, Column, Paragraph, Row } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import {
    isVerifiedNonceCurrent,
    selectVerifiedNonceEntry,
    selectVerifiedNonceInfo,
} from 'src/slices/wallet/verifiedNonce/verifiedNonceSlice';
import {
    cancelAccountNonceVerificationThunk,
    loadVerifiedNonceInfoThunk,
    verifyAccountNonceThunk,
} from 'src/slices/wallet/verifiedNonce/verifiedNonceThunks';

import { VerifiedNonceDetails } from './VerifiedNonceDetails';

type VerifiedAccountNonceProps = {
    account: AccountWithNetworkType<'ethereum'>;
};

// Ticks while a result is displayed so its observed age and staleness keep up with the clock.
const useNowMs = (isTicking: boolean) => {
    const [nowMs, setNowMs] = useState(() => Date.now());

    useEffect(() => {
        if (!isTicking) return undefined;
        setNowMs(Date.now());
        const interval = setInterval(() => setNowMs(Date.now()), 1000);

        return () => clearInterval(interval);
    }, [isTicking]);

    return nowMs;
};

export const VerifiedAccountNonce = ({ account }: VerifiedAccountNonceProps) => {
    const entry = useSelector(state => selectVerifiedNonceEntry(state, account.key));
    const info = useSelector(selectVerifiedNonceInfo);
    const { dispatch } = useServices(selectDispatch);
    const { nonceInfo } = useEvmNonceInfo(account);
    const nowMs = useNowMs(entry?.status === 'verified');

    useEffect(() => {
        if (!info) dispatch(loadVerifiedNonceInfoThunk());
    }, [dispatch, info]);

    // Leaving the account invalidates its running verification; a late reply is then discarded.
    useEffect(
        () => () => {
            dispatch(cancelAccountNonceVerificationThunk({ accountKey: account.key }));
        },
        [dispatch, account.key],
    );

    const verify = () => dispatch(verifyAccountNonceThunk({ accountKey: account.key }));
    const cancel = () => dispatch(cancelAccountNonceVerificationThunk({ accountKey: account.key }));

    if (info && !info.isAvailable) {
        return (
            <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation
                    id="TR_VERIFIED_NONCE_UNAVAILABLE"
                    values={{ code: info.unavailableCode ?? 'NATIVE_UNAVAILABLE' }}
                />
            </Paragraph>
        );
    }

    const isRunning = entry?.status === 'running';
    const current =
        entry?.status === 'verified' && isVerifiedNonceCurrent(entry.result, nowMs)
            ? entry.result
            : null;
    const lastVerified =
        entry?.status === 'verified' ? entry.result : (entry?.lastVerified ?? null);
    const ageSeconds = current
        ? Math.max(0, Math.floor(nowMs / 1000) - Number(current.block.timestampSeconds))
        : 0;
    const localNextNonce =
        nonceInfo && lastVerified && String(nonceInfo.nextNonce) !== lastVerified.nonce
            ? nonceInfo.nextNonce
            : null;
    let verifyLabelId: 'TR_RETRY' | 'TR_VERIFIED_NONCE_VERIFY_AGAIN' | 'TR_VERIFIED_NONCE_VERIFY' =
        'TR_VERIFIED_NONCE_VERIFY';
    if (entry?.status === 'failed' && entry.failure.retryable) verifyLabelId = 'TR_RETRY';
    else if (lastVerified) verifyLabelId = 'TR_VERIFIED_NONCE_VERIFY_AGAIN';

    return (
        <Column gap={8}>
            {current && (
                <Row gap={8}>
                    <Paragraph typographyStyle="body-sm">
                        <Translation
                            id="TR_VERIFIED_NONCE_VALUE"
                            values={{ nonce: current.nonce }}
                        />
                    </Paragraph>
                    <Badge intent="brand" size="small">
                        <Translation id="TR_VERIFIED_NONCE_VERIFIED_IN_SUITE" />
                    </Badge>
                </Row>
            )}
            {current && (
                <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                    <Translation
                        id="TR_VERIFIED_NONCE_BLOCK"
                        values={{ blockNumber: current.block.number, ageSeconds }}
                    />
                </Paragraph>
            )}
            {!current && lastVerified && (
                <Row gap={8}>
                    <Paragraph typographyStyle="body-sm">
                        <Translation
                            id="TR_VERIFIED_NONCE_LAST_VALUE"
                            values={{ nonce: lastVerified.nonce }}
                        />
                    </Paragraph>
                    <Badge intent="warning" size="small">
                        <Translation id="TR_VERIFIED_NONCE_OUT_OF_DATE" />
                    </Badge>
                </Row>
            )}
            {entry?.status === 'failed' && (
                <Paragraph typographyStyle="body-xs" intent="critical">
                    <Translation
                        id="TR_VERIFIED_NONCE_FAILED"
                        values={{ code: entry.failure.code }}
                    />
                </Paragraph>
            )}
            {localNextNonce !== null && (
                <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                    <Translation
                        id="TR_VERIFIED_NONCE_LOCAL_NEXT"
                        values={{ nonce: localNextNonce }}
                    />
                </Paragraph>
            )}
            {/* A stale result is still a genuine observation; its record stays checkable. */}
            {lastVerified && (
                <VerifiedNonceDetails key={lastVerified.requestId} result={lastVerified} />
            )}
            {isRunning ? (
                <Row gap={8}>
                    <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_VERIFIED_NONCE_VERIFYING" />
                    </Paragraph>
                    <Button intent="neutral" priority="secondary" size="small" onClick={cancel}>
                        <Translation id="TR_CANCEL" />
                    </Button>
                </Row>
            ) : (
                <Button
                    intent="neutral"
                    priority="secondary"
                    size="small"
                    onClick={verify}
                    isDisabled={info === null}
                    data-testid="@wallet/account-details/verify-nonce-button"
                >
                    <Translation id={verifyLabelId} />
                </Button>
            )}
        </Column>
    );
};
