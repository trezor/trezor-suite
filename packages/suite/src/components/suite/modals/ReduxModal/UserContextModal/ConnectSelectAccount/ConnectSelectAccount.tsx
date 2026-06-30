import { useEffect } from 'react';

import { useDevice } from '@suite/device';
import { Translation, type TranslationKey } from '@suite/intl';
import {
    SELECT_ACCOUNT_PAGE_SIZE,
    type SelectAccountCandidate,
    type SelectAccountTypeTab,
    connectPopupActions,
    connectPopupBackToManualAccountsThunk,
    connectPopupLoadSelectAccountPageThunk,
    connectPopupResolveSelectAccountThunk,
    connectPopupSelectManualAccountThunk,
    connectPopupVerifySelectAccountThunk,
    selectConnectPopupCall,
} from '@suite-common/connect-popup';
import { type AccountType } from '@suite-common/wallet-config';
import { Column, H3, Icon, Modal, Paragraph, Row, SubTabs, Text } from '@trezor/components';
import { ConfirmOnDevicePill } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
import { Pagination } from 'src/components/wallet/Pagination';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { SelectAccountRow } from './SelectAccountRow';

// Labels for the network's built-in account types; custom tabs carry their own `customLabel`.
const ACCOUNT_TYPE_LABELS: Partial<Record<AccountType, TranslationKey>> = {
    normal: 'TR_ACCOUNT_TYPE_DEFAULT',
    taproot: 'TR_ACCOUNT_TYPE_TAPROOT',
    segwit: 'TR_ACCOUNT_TYPE_SEGWIT',
    legacy: 'TR_ACCOUNT_TYPE_LEGACY',
    ledger: 'TR_ACCOUNT_TYPE_LEDGER',
};

export const ConnectSelectAccount = () => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const popupCall = useSelector(selectConnectPopupCall);

    // Load the first page once the picker opens (the Connect method only sets up the state).
    const isSelectAccount = popupCall?.state === 'select-account';
    const isEmpty = isSelectAccount && popupCall.candidates.length === 0;
    useEffect(() => {
        if (isEmpty) {
            dispatch(connectPopupLoadSelectAccountPageThunk({ page: 0 }));
        }
    }, [isEmpty, dispatch]);

    if (popupCall?.state !== 'select-account') return null;

    const {
        options,
        candidates,
        selectedAccountTypeKey,
        page,
        exported,
        totalCandidates,
        manualPhase,
        manualAccountIndex,
    } = popupCall;
    const { selectionType, minCount, maxCount, accountTypeTabs, addressSelection } = options;
    // 'manual' is a two-phase flow: pick an account (drill-in, no export), then pick one of its
    // used addresses (the actual export). Every other mode has a single, flat account-index list.
    const isManualAccountPickPhase = addressSelection === 'manual' && manualPhase !== 'address';
    const isManualAddressPhase = addressSelection === 'manual' && manualPhase === 'address';
    const isMulti = selectionType === 'multi';
    const activeTab =
        accountTypeTabs.find(tab => tab.key === selectedAccountTypeKey) ?? accountTypeTabs[0]!;

    const startIndex = page * SELECT_ACCOUNT_PAGE_SIZE;
    const pageCandidates = candidates
        .filter(
            c =>
                c.accountTypeKey === activeTab.key &&
                c.accountIndex >= startIndex &&
                c.accountIndex < startIndex + SELECT_ACCOUNT_PAGE_SIZE,
        )
        .sort((a, b) => a.accountIndex - b.accountIndex);

    const selectedCandidates = candidates.filter(c => c.selected);
    const selectedCount = selectedCandidates.length;
    const isVerifying = candidates.some(c => c.verifying);
    // Deriving accounts issues sequential getAccountInfo calls on the device. Any competing device
    // call fired mid-discovery (verify, retry, or a fresh page/tab load) would contend for the same
    // device and get cancelled — so those actions are blocked until the visible page has settled.
    // Selection stays live: it's pure Redux state and touches no device.
    const isDiscovering = pageCandidates.some(c => c.loading);

    // Verification is always available but optional (mirrors ConnectAddressConfirmation) — connecting
    // only requires a valid selection.
    const canConfirm =
        selectedCount >= minCount &&
        (maxCount === undefined || selectedCount <= maxCount) &&
        !isVerifying;

    const toggle = (target: SelectAccountCandidate) => {
        const isTarget = (c: SelectAccountCandidate) =>
            c.accountIndex === target.accountIndex && c.accountTypeKey === target.accountTypeKey;

        const next = candidates.map(c => {
            if (selectionType === 'single') {
                return { ...c, selected: isTarget(c) ? !c.selected : false };
            }
            if (!isTarget(c)) return c;
            // respect maxCount when selecting a new one
            if (!c.selected && maxCount !== undefined && selectedCount >= maxCount) return c;

            return { ...c, selected: !c.selected };
        });

        dispatch(connectPopupActions.updateSelectAccount({ candidates: next }));
    };

    const verify = (candidate: SelectAccountCandidate) =>
        dispatch(
            connectPopupVerifySelectAccountThunk({
                accountIndex: candidate.accountIndex,
                accountTypeKey: candidate.accountTypeKey,
            }),
        );

    // Manual account-pick phase: clicking a row drills in, it doesn't toggle a selection.
    const selectManualAccount = (candidate: SelectAccountCandidate) =>
        dispatch(connectPopupSelectManualAccountThunk({ accountIndex: candidate.accountIndex }));

    const backToManualAccounts = () => dispatch(connectPopupBackToManualAccountsThunk());

    const retry = () => dispatch(connectPopupLoadSelectAccountPageThunk({ page }));

    const goToPage = (nextPage: number) => {
        if (nextPage < 0 || isVerifying || isDiscovering) return;
        dispatch(connectPopupLoadSelectAccountPageThunk({ page: nextPage }));
    };

    const selectAccountType = (tab: SelectAccountTypeTab) => {
        if (tab.key === activeTab.key || isVerifying || isDiscovering) return;
        dispatch(
            connectPopupActions.updateSelectAccount({
                selectedAccountTypeKey: tab.key,
                page: 0,
                // switching account type invalidates any account chosen in the manual address phase
                manualPhase: addressSelection === 'manual' ? 'account' : undefined,
                manualAccountIndex: undefined,
            }),
        );
        dispatch(connectPopupLoadSelectAccountPageThunk({ page: 0 }));
    };

    // Accounts can always be derived further, so there's no last page — except in the UTXO
    // `addressSelection: 'manual'` flow, where `totalCandidates` bounds the used-address list.
    const paginationTotalItems = totalCandidates ?? (page + 2) * SELECT_ACCOUNT_PAGE_SIZE;

    const onConnect = () => dispatch(connectPopupResolveSelectAccountThunk({ confirmed: true }));
    // Cancel (select phase) or close (exported phase) — the thunk routes based on `exported`.
    const onFinish = () => dispatch(connectPopupResolveSelectAccountThunk({ confirmed: false }));

    const rows = exported ? selectedCandidates : pageCandidates;

    let descriptionKey: TranslationKey = 'TR_CONNECT_SELECT_ACCOUNT_DESCRIPTION';
    if (exported) {
        descriptionKey = 'TR_CONNECT_SELECT_ACCOUNT_EXPORTED_DESCRIPTION';
    } else if (isManualAccountPickPhase) {
        descriptionKey = 'TR_CONNECT_SELECT_ACCOUNT_PICK_ACCOUNT_DESCRIPTION';
    }

    let rowInteractionMode: 'toggle' | 'drillIn' | 'readOnly' = 'toggle';
    if (exported) {
        rowInteractionMode = 'readOnly';
    } else if (isManualAccountPickPhase) {
        rowInteractionMode = 'drillIn';
    }

    return (
        <ConnectModalBackdrop onClick={onFinish} canSwitchDevice={false}>
            {isVerifying && (
                <ConfirmOnDevicePill
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    deviceModelInternal={device?.features?.internal_model}
                    deviceUnitColor={device?.features?.unit_color}
                />
            )}
            <Modal.ModalBase
                intent="brand"
                onBackClick={
                    isManualAddressPhase && !exported && !isVerifying
                        ? backToManualAccounts
                        : undefined
                }
                backButtonTooltip={<Translation id="TR_BACK" />}
                bottomContent={
                    exported ? (
                        <Modal.Button
                            onClick={onFinish}
                            size="medium"
                            isDisabled={isVerifying}
                            data-testid="@connect-select-account/close-button"
                        >
                            <Translation id="TR_CLOSE" />
                        </Modal.Button>
                    ) : (
                        <>
                            {!isManualAccountPickPhase && (
                                <Modal.Button
                                    onClick={onConnect}
                                    size="medium"
                                    isDisabled={!canConfirm}
                                    data-testid="@connect-select-account/confirm-button"
                                >
                                    <Translation id="TR_CONNECT_SELECT_ACCOUNT_CONFIRM" />
                                </Modal.Button>
                            )}
                            <Modal.Button
                                intent="neutral"
                                priority="secondary"
                                onClick={onFinish}
                                size="medium"
                                isDisabled={isVerifying}
                                data-testid="@connect-select-account/cancel-button"
                            >
                                <Translation id="TR_CANCEL" />
                            </Modal.Button>
                        </>
                    )
                }
            >
                <Column gap={spacings.md}>
                    <Column gap={spacings.xs}>
                        {exported ? (
                            <Row alignItems="center" gap={spacings.sm}>
                                <Icon name="checkCircle" size={32} intent="brand" />
                                <H3 intent="brand">
                                    <Translation id="TR_CONNECT_SELECT_ACCOUNT_EXPORTED" />
                                </H3>
                            </Row>
                        ) : (
                            <H3>
                                <Translation id="TR_CONNECT_SELECT_ACCOUNT" />
                            </H3>
                        )}
                        <ConnectCallSource />
                        <Paragraph>
                            <Translation id={descriptionKey} />
                        </Paragraph>
                        {isManualAddressPhase && (
                            <Text typographyStyle="body-xs" color="contentSecondary">
                                <Translation
                                    id="TR_CONNECT_SELECT_ACCOUNT_LABEL"
                                    values={{ index: (manualAccountIndex ?? 0) + 1 }}
                                />
                            </Text>
                        )}
                    </Column>

                    <Column gap={spacings.sm}>
                        {accountTypeTabs.length > 1 && !exported && !isManualAddressPhase && (
                            <SubTabs activeItemId={activeTab.key}>
                                {accountTypeTabs.map(tab => (
                                    <SubTabs.Item
                                        key={tab.key}
                                        id={tab.key}
                                        onClick={() => selectAccountType(tab)}
                                        data-testid={`@connect-select-account/type-tab/${tab.key}`}
                                    >
                                        {tab.accountType && ACCOUNT_TYPE_LABELS[tab.accountType] ? (
                                            <Translation
                                                id={ACCOUNT_TYPE_LABELS[tab.accountType]!}
                                            />
                                        ) : (
                                            tab.customLabel
                                        )}
                                    </SubTabs.Item>
                                ))}
                            </SubTabs>
                        )}

                        {isMulti && !exported && !isManualAccountPickPhase && (
                            <Text typographyStyle="body-xs">
                                <Translation
                                    id="TR_CONNECT_SELECT_ACCOUNT_SELECTED"
                                    values={{
                                        count: maxCount
                                            ? `${selectedCount}/${maxCount}`
                                            : selectedCount,
                                    }}
                                />
                            </Text>
                        )}

                        <Column gap={spacings.xs}>
                            {rows.map(candidate => (
                                <SelectAccountRow
                                    key={`${candidate.accountTypeKey}-${candidate.accountIndex}`}
                                    candidate={candidate}
                                    label={
                                        <Translation
                                            id={
                                                isManualAddressPhase
                                                    ? 'TR_CONNECT_SELECT_ACCOUNT_ADDRESS_LABEL'
                                                    : 'TR_CONNECT_SELECT_ACCOUNT_LABEL'
                                            }
                                            values={{ index: candidate.accountIndex + 1 }}
                                        />
                                    }
                                    interactionMode={rowInteractionMode}
                                    disabled={isVerifying}
                                    discovering={isDiscovering}
                                    deviceModelInternal={device?.features?.internal_model}
                                    onToggle={() =>
                                        isManualAccountPickPhase
                                            ? selectManualAccount(candidate)
                                            : toggle(candidate)
                                    }
                                    onVerify={() => verify(candidate)}
                                    onRetry={retry}
                                />
                            ))}
                        </Column>

                        {!exported && (
                            <Pagination
                                currentPage={page + 1}
                                perPage={SELECT_ACCOUNT_PAGE_SIZE}
                                totalItems={paginationTotalItems}
                                explicitNavigation
                                noUpperBound={totalCandidates === undefined}
                                onPageSelected={p => goToPage(p - 1)}
                            />
                        )}
                    </Column>
                </Column>
            </Modal.ModalBase>
        </ConnectModalBackdrop>
    );
};
