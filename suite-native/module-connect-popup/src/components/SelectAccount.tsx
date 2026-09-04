import { useEffect } from 'react';
import { ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

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
import {
    Button,
    HStack,
    IconButton,
    SegmentedControl,
    Text,
    TitleHeader,
    VStack,
} from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

import { SelectAccountRow } from './SelectAccountRow';

// Labels for the network's built-in account types; custom tabs carry their own `customLabel`.
const ACCOUNT_TYPE_LABELS: Partial<Record<AccountType, TxKeyPath>> = {
    normal: 'moduleConnectPopup.selectAccount.accountType.normal',
    taproot: 'moduleConnectPopup.selectAccount.accountType.taproot',
    segwit: 'moduleConnectPopup.selectAccount.accountType.segwit',
    legacy: 'moduleConnectPopup.selectAccount.accountType.legacy',
    ledger: 'moduleConnectPopup.selectAccount.accountType.ledger',
};

const tabLabel = (tab: SelectAccountTypeTab) => {
    const labelKey = tab.accountType ? ACCOUNT_TYPE_LABELS[tab.accountType] : undefined;

    return labelKey ? <Translation id={labelKey} /> : (tab.customLabel ?? tab.key);
};

export const SelectAccount = () => {
    const dispatch = useDispatch();
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

    // Verification is always available but optional (mirrors AddressConfirmation) — connecting only
    // requires a valid selection.
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

    const selectAccountType = (tabKey: string) => {
        if (tabKey === activeTab.key || isVerifying || isDiscovering) return;
        dispatch(
            connectPopupActions.updateSelectAccount({
                selectedAccountTypeKey: tabKey,
                page: 0,
                // switching account type invalidates any account chosen in the manual address phase
                manualPhase: addressSelection === 'manual' ? 'account' : undefined,
                manualAccountIndex: undefined,
            }),
        );
        dispatch(connectPopupLoadSelectAccountPageThunk({ page: 0 }));
    };

    const onConnect = () => dispatch(connectPopupResolveSelectAccountThunk({ confirmed: true }));
    // Cancel (select phase) or close (exported phase) — the thunk routes based on `exported`.
    const onFinish = () => dispatch(connectPopupResolveSelectAccountThunk({ confirmed: false }));

    const rows = exported ? selectedCandidates : pageCandidates;

    // Accounts can always be derived further, so there's no last page — except in the UTXO
    // `addressSelection: 'manual'` flow, where `totalCandidates` bounds the used-address list.
    const totalPages =
        totalCandidates !== undefined
            ? Math.max(1, Math.ceil(totalCandidates / SELECT_ACCOUNT_PAGE_SIZE))
            : undefined;
    const canGoPrev = page > 0 && !isVerifying && !isDiscovering;
    const canGoNext =
        (totalPages === undefined || page + 1 < totalPages) && !isVerifying && !isDiscovering;
    const showPagination = !exported && (page > 0 || canGoNext);

    let descriptionKey: TxKeyPath = 'moduleConnectPopup.selectAccount.description';
    if (exported) {
        descriptionKey = 'moduleConnectPopup.selectAccount.exportedDescription';
    } else if (isManualAccountPickPhase) {
        descriptionKey = 'moduleConnectPopup.selectAccount.pickAccountDescription';
    }

    let rowInteractionMode: 'toggle' | 'drillIn' | 'readOnly' = 'toggle';
    if (exported) {
        rowInteractionMode = 'readOnly';
    } else if (isManualAccountPickPhase) {
        rowInteractionMode = 'drillIn';
    }

    return (
        <VStack testID="@popup/select-account" spacing="sp12" flex={1}>
            <TitleHeader
                title={
                    <Translation
                        id={
                            exported
                                ? 'moduleConnectPopup.selectAccount.exportedTitle'
                                : 'moduleConnectPopup.selectAccount.title'
                        }
                    />
                }
                subtitle={<Translation id={descriptionKey} />}
            />

            {isManualAddressPhase && !exported && (
                <Button
                    intent="neutral"
                    priority="secondary"
                    iconLeft="arrowLeft"
                    onPress={backToManualAccounts}
                >
                    <Translation
                        id="moduleConnectPopup.selectAccount.accountLabel"
                        values={{ index: (manualAccountIndex ?? 0) + 1 }}
                    />
                </Button>
            )}

            {accountTypeTabs.length > 1 && !exported && !isManualAddressPhase && (
                <SegmentedControl
                    selectedValue={activeTab.key}
                    onValueChange={selectAccountType}
                    options={accountTypeTabs.map(tab => ({
                        value: tab.key,
                        label: tabLabel(tab),
                    }))}
                />
            )}

            {isMulti && !exported && !isManualAccountPickPhase && (
                <Text variant="body-sm" color="contentSecondary">
                    <Translation
                        id="moduleConnectPopup.selectAccount.selectedCount"
                        values={{
                            count: maxCount ? `${selectedCount}/${maxCount}` : selectedCount,
                        }}
                    />
                </Text>
            )}

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <VStack spacing="sp8">
                    {rows.map(candidate => (
                        <SelectAccountRow
                            key={`${candidate.accountTypeKey}-${candidate.accountIndex}`}
                            candidate={candidate}
                            label={
                                <Translation
                                    id={
                                        isManualAddressPhase
                                            ? 'moduleConnectPopup.selectAccount.addressLabel'
                                            : 'moduleConnectPopup.selectAccount.accountLabel'
                                    }
                                    values={{ index: candidate.accountIndex + 1 }}
                                />
                            }
                            interactionMode={rowInteractionMode}
                            disabled={isVerifying}
                            discovering={isDiscovering}
                            onToggle={() =>
                                isManualAccountPickPhase
                                    ? selectManualAccount(candidate)
                                    : toggle(candidate)
                            }
                            onVerify={() => verify(candidate)}
                            onRetry={retry}
                        />
                    ))}
                </VStack>
            </ScrollView>

            {showPagination && (
                <HStack alignItems="center" justifyContent="space-between">
                    <IconButton
                        iconName="caretLeft"
                        intent="neutral"
                        priority="secondary"
                        size="medium"
                        isDisabled={!canGoPrev}
                        onPress={() => goToPage(page - 1)}
                    />
                    <Text variant="body-sm" color="contentSecondary">
                        <Translation
                            id="moduleConnectPopup.selectAccount.page"
                            values={{ page: page + 1 }}
                        />
                    </Text>
                    <IconButton
                        iconName="caretRight"
                        intent="neutral"
                        priority="secondary"
                        size="medium"
                        isDisabled={!canGoNext}
                        onPress={() => goToPage(page + 1)}
                    />
                </HStack>
            )}

            <VStack spacing="sp8">
                {exported ? (
                    <Button
                        testID="@popup/select-account/close"
                        size="medium"
                        isDisabled={isVerifying}
                        onPress={onFinish}
                    >
                        <Translation id="generic.buttons.close" />
                    </Button>
                ) : (
                    <>
                        {!isManualAccountPickPhase && (
                            <Button
                                testID="@popup/select-account/confirm"
                                size="medium"
                                isDisabled={!canConfirm}
                                onPress={onConnect}
                            >
                                <Translation id="moduleConnectPopup.selectAccount.connect" />
                            </Button>
                        )}
                        <Button
                            testID="@popup/select-account/cancel"
                            size="medium"
                            intent="neutral"
                            priority="secondary"
                            isDisabled={isVerifying}
                            onPress={onFinish}
                        >
                            <Translation id="generic.buttons.cancel" />
                        </Button>
                    </>
                )}
            </VStack>
        </VStack>
    );
};
