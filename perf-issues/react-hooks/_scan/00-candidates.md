# Grep candidate harvest — react-hooks sweep

Generated at base commit 9e0d5b6a45. Raw candidates only — every row needs verification by reading.
Scan agents: take the rows under your area's path prefixes.

## C1 — eslint-disable react-hooks/exhaustive-deps (each is a class-6 finding candidate)

```
packages/components/src/components/ResizableBox/ResizableBox.tsx:333:    }, []); // eslint-disable-line react-hooks/exhaustive-deps
packages/components/src/components/form/Select/customComponents.tsx:178:        // eslint-disable-next-line react-hooks/exhaustive-deps
packages/react-utils/src/hooks/useAsyncMemo.test.ts:21:            // eslint-disable-next-line react-hooks/exhaustive-deps
packages/react-utils/src/hooks/useAsyncMemo.test.ts:42:            // eslint-disable-next-line react-hooks/exhaustive-deps
packages/react-utils/src/hooks/useAsyncMemo.test.ts:61:            // eslint-disable-next-line react-hooks/exhaustive-deps
packages/react-utils/src/hooks/useAsyncMemo.test.ts:72:            // eslint-disable-next-line react-hooks/exhaustive-deps
packages/react-utils/src/hooks/useAsyncMemo.test.ts:9:        // eslint-disable-next-line react-hooks/exhaustive-deps
packages/react-utils/src/hooks/useAsyncMemo.ts:37:        // eslint-disable-next-line react-hooks/exhaustive-deps
packages/react-utils/src/hooks/useKeyPress.ts:32:        // eslint-disable-next-line react-hooks/exhaustive-deps
packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/AccountName/AccountName.tsx:53:        // eslint-disable-next-line react-hooks/exhaustive-deps
packages/suite/src/components/wallet/Fees/CollapsibleFees/CustomFee/CustomFeeTron.tsx:29:        // eslint-disable-next-line react-hooks/exhaustive-deps
packages/suite/src/hooks/settings/backends/useBackendsForm.ts:87:        // eslint-disable-next-line react-hooks/exhaustive-deps
packages/suite/src/hooks/wallet/trading/form/buy/useTradingBuyForm.ts:131:        // eslint-disable-next-line react-hooks/exhaustive-deps
packages/suite/src/hooks/wallet/trading/form/common/useTradingComposeTransaction.ts:209:        // eslint-disable-next-line react-hooks/exhaustive-deps
packages/suite/src/hooks/wallet/trading/form/common/useTradingComposeTransaction.ts:275:        // eslint-disable-next-line react-hooks/exhaustive-deps
packages/suite/src/hooks/wallet/trading/form/common/useTradingComposeTransaction.ts:98:        // eslint-disable-next-line react-hooks/exhaustive-deps
packages/suite/src/hooks/wallet/useSendForm.ts:400:        // eslint-disable-next-line react-hooks/exhaustive-deps
packages/suite/src/hooks/wallet/useSendForm.ts:415:        // eslint-disable-next-line react-hooks/exhaustive-deps
packages/suite/src/support/suite/useConnectPopup.tsx:152:        // eslint-disable-next-line react-hooks/exhaustive-deps
packages/suite/src/views/wallet/details/CoinjoinSetup/SetupSlider/SliderInput.tsx:90:    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
packages/suite/src/views/wallet/trading/exchange/TradingFormOfferExchangeActions.tsx:113:        // eslint-disable-next-line react-hooks/exhaustive-deps
suite-common/dependency-injection/src/useServices.tsx:68:    // eslint-disable-next-line react-hooks/exhaustive-deps
suite-native/device-authorization/src/hooks/usePinAction.tsx:142:            // eslint-disable-next-line react-hooks/exhaustive-deps
suite-native/firmware/src/components/FirmwareInstallationScreenContent.tsx:217:        // eslint-disable-next-line react-hooks/exhaustive-deps
suite-native/module-accounts-import/src/screens/AccountImportLoadingScreen.tsx:71:        // eslint-disable-next-line react-hooks/exhaustive-deps
suite-native/module-check-backup/src/hooks/useCheckBackupOnMount.tsx:66:        // eslint-disable-next-line react-hooks/exhaustive-deps
suite-native/module-device-onboarding/src/screens/DeviceAuthenticityScreen.tsx:42:        // eslint-disable-next-line react-hooks/exhaustive-deps
suite-native/module-device-onboarding/src/screens/DeviceDisconnectedScreen.tsx:70:        // eslint-disable-next-line react-hooks/exhaustive-deps
suite-native/module-device-onboarding/src/screens/DeviceTutorialScreen.tsx:36:            // eslint-disable-next-line react-hooks/exhaustive-deps
suite-native/module-device-onboarding/src/screens/UninitializedDeviceLandingScreen.tsx:141:        // eslint-disable-next-line react-hooks/exhaustive-deps
suite-native/module-send/src/hooks/useSendForm.tsx:315:        // eslint-disable-next-line react-hooks/exhaustive-deps
suite-native/react-native-graph/src/AnimatedLineGraph.tsx:289:        // eslint-disable-next-line react-hooks/exhaustive-deps
suite-native/react-native-graph/src/AnimatedLineGraph.tsx:396:        // eslint-disable-next-line react-hooks/exhaustive-deps
suite-native/react-native-graph/src/AnimatedLineGraph.tsx:451:        // eslint-disable-next-line react-hooks/exhaustive-deps
```

## C2 — react-hook-form watch( in suite-native (compiler bail-out candidates)

```

```

## C2b — bare watch() in web packages/suite (whole-form re-render per keystroke)

```
packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormApproval.tsx:63:    const { exchangeType, rateType } = watch();
packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOffersWarnings.tsx:24:        const { countrySelect, countrySubdivisionSelect } = context.watch();
packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormOffer/hooks/useTradingFormOfferCommon.ts:35:    const { amountInCrypto } = watch();
packages/suite/src/views/wallet/trading/exchange/TradingFormOfferExchangeActions.tsx:44:    const { outputs, sendCryptoSelect, receiveCryptoSelect, exchangeType, rateType } = watch();
packages/suite/src/views/wallet/trading/sell/TradingFormOfferSellActions.tsx:30:    const { outputs } = watch();
```

## C3 — useSelector returning derived/fresh reference (multiline window 160 chars)

```
packages/suite/src/components/suite/layouts/SuiteLayout/CoinjoinBars/CoinjoinBars.tsx:10:    const sessionCount = coinjoinAccounts.filter(
packages/suite/src/components/suite/layouts/SuiteLayout/CoinjoinBars/CoinjoinBars.tsx:8:useSelector(state => state.wallet.coinjoin.accounts);
packages/suite/src/components/suite/layouts/SuiteLayout/Sidebar/QuickActions/NavBackends.tsx:52:useSelector(state => state.wallet.blockchain);
packages/suite/src/components/suite/layouts/SuiteLayout/Sidebar/QuickActions/NavBackends.tsx:54:    return (
packages/suite/src/components/suite/layouts/SuiteLayout/Sidebar/QuickActions/NavBackends.tsx:55:        <Column gap={16} padding={4}>
packages/suite/src/components/suite/layouts/SuiteLayout/Sidebar/QuickActions/NavBackends.tsx:56:            <Column gap={12}>
packages/suite/src/components/suite/layouts/SuiteLayout/Sidebar/QuickActions/NavBackends.tsx:57:                {customBackends.map(
packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputList.tsx:81:useSelector(state => state.wallet.accounts);
packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputList.tsx:82:    const { networkType, symbol } = account;
packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputList.tsx:83:    const isMultirecipient = outputs.filter(
packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AddAccountButton/AddCoinjoinAccountButton.tsx:58:useSelector(state => state.wallet.accounts);
packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AddAccountButton/AddCoinjoinAccountButton.tsx:59:    const dispatch = useDispatch();
packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AddAccountButton/AddCoinjoinAccountButton.tsx:61:    if (!device) {
packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AddAccountButton/AddCoinjoinAccountButton.tsx:62:        return null;
packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AddAccountButton/AddCoinjoinAccountButton.tsx:63:    }
packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AddAccountButton/AddCoinjoinAccountButton.tsx:65:    const coinjoinAccounts = accounts.filter(
packages/suite/src/components/suite/notifications/NotificationRenderer/CoinProtocolRenderer.tsx:45:useSelector(state =>
packages/suite/src/components/suite/notifications/NotificationRenderer/CoinProtocolRenderer.tsx:46:        selectDeviceAccountsByNetworkSymbol(state, networkSymbol),
packages/suite/src/components/suite/notifications/NotificationRenderer/CoinProtocolRenderer.tsx:47:    ).filter(
packages/suite/src/components/wallet/TokenIconSetWrapper.tsx:24:useSelector(state => selectCoinDefinitions(state, symbol));
packages/suite/src/components/wallet/TokenIconSetWrapper.tsx:26:    const allTokensWithRates = accounts.flatMap(
packages/suite/src/components/wallet/WalletLayout/AccountBanners/hooks/useEarnEthBanner.ts:62:useSelector(state => {
packages/suite/src/components/wallet/WalletLayout/AccountBanners/hooks/useEarnEthBanner.ts:63:        const enabledVaultApys = wrappedNativeVaults
packages/suite/src/components/wallet/WalletLayout/AccountBanners/hooks/useEarnEthBanner.ts:64:            .filter(
packages/suite/src/hooks/suite/useBioAuthDesktopApi.ts:16:useSelector(state => ({
packages/suite/src/hooks/suite/useGraph.ts:12:useSelector(state => state.wallet.graph.selectedRange);
packages/suite/src/hooks/suite/useGraph.ts:14:    const actions = useMemo(
packages/suite/src/hooks/suite/useGraph.ts:15:        () => ({
packages/suite/src/hooks/wallet/useTotalFiatBalance.ts:13:useSelector(state => state.tokenDefinitions);
packages/suite/src/hooks/wallet/useTotalFiatBalance.ts:14:    const deviceAccounts: Account[] = accounts.map(
packages/suite/src/views/dashboard/AssetsView/AssetTable/AssetRow.tsx:78:useSelector(state => selectCoinDefinitions(state, network.symbol));
packages/suite/src/views/dashboard/AssetsView/AssetTable/AssetRow.tsx:79:        const stakingAccountsForAsset = stakingAccounts.filter(
packages/suite/src/views/dashboard/DashboardPromoBanner/DashboardPromoBanner.tsx:31:useSelector(state =>
packages/suite/src/views/dashboard/DashboardPromoBanner/DashboardPromoBanner.tsx:32:        selectFeaturesConfig(state, Feature.banners.dashboard.promo),
packages/suite/src/views/dashboard/DashboardPromoBanner/DashboardPromoBanner.tsx:33:    );
packages/suite/src/views/dashboard/DashboardPromoBanner/DashboardPromoBanner.tsx:35:    const deduplicatedBanners = allPromoBanners
packages/suite/src/views/dashboard/DashboardPromoBanner/DashboardPromoBanner.tsx:36:        .map(
suite-native/module-accounts-management/src/screens/AccountAssetsScreen.tsx:68:useSelector((state: TokensRootState) =>
suite-native/module-accounts-management/src/screens/AccountAssetsScreen.tsx:69:        selectAccountManuallyHiddenTokensCount(state, accountKey),
suite-native/module-accounts-management/src/screens/AccountAssetsScreen.tsx:70:    );
suite-native/module-accounts-management/src/screens/AccountAssetsScreen.tsx:72:    const tokenCount = sections.filter(
suite-native/module-add-accounts/src/screens/AddCoinDiscoveryFinishedScreen.tsx:34:useSelector((state: AccountsRootState & DeviceRootState) =>
suite-native/module-add-accounts/src/screens/AddCoinDiscoveryFinishedScreen.tsx:35:        selectDeviceAccountsByNetworkSymbol(state, networkSymbol),
suite-native/module-add-accounts/src/screens/AddCoinDiscoveryFinishedScreen.tsx:36:    ).filter(
suite-native/module-trading/src/components/buy/BuyProviderPicker.tsx:73:useSelector((state: TradingRootState) =>
suite-native/module-trading/src/components/buy/BuyProviderPicker.tsx:74:        selectBuyQuotesByPaymentMethodNative(state, paymentMethod),
suite-native/module-trading/src/components/buy/BuyProviderPicker.tsx:75:    );
suite-native/module-trading/src/components/buy/BuyProviderPicker.tsx:77:    const shouldShowPicker = (providers && Object.values(
suite-native/module-trading/src/components/sell/payment/SellProviderPicker.tsx:74:useSelector((state: TradingRootState) =>
suite-native/module-trading/src/components/sell/payment/SellProviderPicker.tsx:75:        selectSellQuotesByPaymentMethod(state, paymentMethod),
suite-native/module-trading/src/components/sell/payment/SellProviderPicker.tsx:76:    );
suite-native/module-trading/src/components/sell/payment/SellProviderPicker.tsx:78:    const shouldShowPicker = (providers && Object.values(
```

## C4 — ?? [] / ?? {} in .tsx (unstable fallback; verify hook relevance by reading)

```
packages/components/src/components/animations/recolorLottieAnimation.tsx:32:    appliedOpacities.set(opacity, new Set([...(appliedAlphas ?? []), alpha]));
packages/suite/src/views/recovery/index.tsx:45:    const { pin, setPin, handlePinSubmit } = usePin(device?.buttonRequests ?? [], pinRequestId);
packages/suite/src/views/wallet/send/Outputs/ReceiveAddressModal/UtxoReceiveAddressModal.tsx:33:        const used = addresses?.used ?? [];
packages/suite/src/views/wallet/send/Outputs/ReceiveAddressModal/UtxoReceiveAddressModal.tsx:34:        const unused = addresses?.unused?.slice(0, MAX_UNUSED_ADDRESSES) ?? [];
packages/suite/src/views/wallet/tokens/hidden-tokens/HiddenTokensTable.tsx:23:    const sortedTokens = account.tokens?.toSorted(sortTokensByName) ?? [];
suite-native/trading-history/src/components/TradeDetailSheet/TradeDetailProviderCard.tsx:35:    const { logo, companyName, supportUrl } = providerInfo ?? {};
packages/product-components/src/components/DeviceAnimation/DeviceAnimation.stories.tsx:16:    const [firstModel, firstModelCfg] = modelEntries[0] ?? [];
packages/suite/src/views/dashboard/AssetsView/AssetsView.tsx:83:        const amount = (accounts[asset.network.symbol] ?? [])
packages/suite/src/views/wallet/send/TotalSent/CardanoSentTokenInfo.tsx:25:            (formOutputs ?? []).filter(o => o.token).map(o => [o.token, o.amount]),
packages/suite/src/views/wallet/trading/common/TradingFooter/TradingFooter.tsx:15:    const { companyName, termsUrl } = provider ?? currentProviderMetadata ?? {};
packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx:138:    const spendableUtxosOnPage = paginatedCategories[0] ?? [];
packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx:139:    const lowAnonymityUtxosOnPage = paginatedCategories[1] ?? [];
packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx:140:    const dustUtxosOnPage = paginatedCategories[2] ?? [];
packages/suite/src/components/suite/bluetooth/BluetoothDeviceListItem.tsx:138:    const isNearbyDevice = (nearbyDevices ?? []).some(
packages/suite/src/components/suite/bluetooth/BluetoothDebugInfo.tsx:33:    const isNearbyDevice = (nearbyDevices ?? []).find(
packages/suite/src/views/settings/SettingsDebug/Backends.tsx:157:                    {Object.entries(identityConnections ?? {}).map(([identity, connection]) => (
suite-native/module-dev-utils/src/screens/MessageSystemManagerScreen.tsx:37:        return (config?.actions ?? []).filter(({ message }) => {
packages/suite/src/views/wallet/send/Options/EthereumOptions/EthereumOptions.tsx:30:    const isEditingNonce = (enabledOptions ?? []).includes('ethereumNonce');
packages/suite/src/views/wallet/trading/common/TradingForm/TradingRevokeModal.tsx:90:        useModalLastValidParams(revokeParams, state.isRevokeModalOpen) ?? {};
suite-native/trading-slippage/src/components/SlippageSummary.tsx:14:        useSelector(selectTradingExchangeSelectedQuote) ?? {};
packages/suite/src/views/wallet/trading/common/TradingForm/TradingApproveModal.tsx:104:        useModalLastValidParams(approveParams, state.isApproveModalOpen) ?? {};
packages/suite/src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/TradingUtxoReceiveAddressModal/TradingUtxoReceiveAddressModal.tsx:58:    const usedAddresses = addresses?.used.filter(matchesQuery) ?? [];
packages/suite/src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/TradingUtxoReceiveAddressModal/TradingUtxoReceiveAddressModal.tsx:60:        addresses?.unused.slice(0, MAX_UNUSED_ADDRESSES).filter(matchesQuery) ?? [];
packages/suite/src/views/wallet/staking/components/AdaStakingDashboard/AdaStakingDashboard.tsx:54:    const { canClaim = false } = getStakingDataForNetwork(account) ?? {};
packages/suite/src/components/suite/Preloader/Preloader.test.tsx:116:        accounts: mockInitialAppState.wallet?.accounts ?? [],
packages/suite/src/views/wallet/staking/components/StakingDashboard/components/PayoutCardNextRewards.tsx:27:    const { autocompoundBalance = '0' } = getStakingDataForNetwork(selectedAccount) ?? {};
packages/suite/src/views/wallet/staking/components/StakingDashboard/components/StakingCard.tsx:128:    } = getStakingDataForNetwork(account) ?? {};
packages/suite/src/components/wallet/TransactionItem/TransactionTarget/TargetAddressLabel.tsx:30:            addresses: target.addresses ?? [],
suite-native/module-accounts-import/src/components/AccountImportConfirmFormScreen.tsx:61:        selectFilterKnownTokens(state, symbol, accountInfo.tokens ?? []),
packages/suite/src/views/wallet/staking/components/StakingDashboard/components/ClaimCard.tsx:31:        getStakingDataForNetwork(selectedAccount) ?? {};
packages/suite/src/views/wallet/staking/components/SolStakingDashboard/SolStakingDashboard.tsx:44:    const { canClaim = false } = getStakingDataForNetwork(account) ?? {};
packages/suite/src/views/wallet/staking/components/EthStakingDashboard/EthStakingDashboard.tsx:75:    const { canClaim = false } = getStakingDataForNetwork(account) ?? {};
packages/suite/src/components/suite/SecurityCheck/DeviceCompromised.test.tsx:46:            accounts: mockInitialAppState.wallet?.accounts ?? [],
suite-native/transaction-management/src/hooks/useShowStayOnScreenAlert.tsx:38:            } = alertOptions ?? {};
suite-native/transactions/src/components/TransactionList.tsx:218:                ...(accountTransactionsByMonth['no-blocktime'] ?? []),
suite-native/transactions/src/components/TransactionList.tsx:231:                ...(accountTransactionsByMonth[monthKey] ?? []).flatMap(transaction =>
suite-native/transactions/src/components/TransactionList.tsx:247:            ...(accountTransactionsByMonth[monthKey] ?? []),
packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountItemsGroup.tsx:68:    const isFiatLoading = areTokenFiatRatesLoading(account, baseCurrencyCode, rates ?? {});
packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewTronFeeNotes.tsx:28:        calculateTronFeeBreakdown(tx, tronResources, account.symbol) ?? {};
packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutput.tsx:602:            return (rewards ?? []).map(reward => ({
suite-native/transactions/src/components/TransactionName.tsx:147:        const { contractType, votes, unstakeAmount } = transaction.tronSpecific ?? {};
suite-native/module-send/src/hooks/useSendForm.tsx:149:                utxos: account?.utxo ?? [],
packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountsList.tsx:106:                      tokens: account.tokens ?? [],
suite-native/module-send/src/screens/SendUtxoScreen.tsx:44:    const [tempSelectedUtxos, setTempSelectedUtxos] = useState<Utxo[]>(selectedUtxos ?? []);
suite-native/module-send/src/screens/SendUtxoScreen.tsx:49:    const filteredUtxos = useFilteredUtxos(account?.utxo ?? [], searchQuery);
suite-native/module-send/src/screens/SendUtxoScreen.tsx:89:            ) ?? [],
suite-native/module-accounts-management/src/screens/AccountsScreen.tsx:26:        () => route.params?.networksFilter ?? [],
packages/suite/src/components/earn/staking/tron/complete/TronVoteSummaryCard.tsx:13:    const apr = (representatives.data ?? []).find(({ address }) => address === votedAddress)?.apr;
packages/suite/src/components/earn/staking/tron/complete/TronStakeSummaryCard.tsx:28:    const apr = (representatives.data ?? []).find(({ address }) => address === votedAddress)?.apr;
packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/WalletConnectProposalModal.tsx:61:                    ) ?? [],
suite-native/module-connect-popup/src/screens/WalletConnectSessionPopupScreen.tsx:57:                ) ?? [],
packages/suite/src/components/earn/staking/tron/vote/TronVoteRepresentativeSelect.tsx:45:            })) ?? [];
packages/suite/src/components/earn/staking/tron/vote/TronVoteApr.tsx:19:    const selected = (representatives.data ?? []).find(({ address }) => address === representative);
packages/suite/src/support/suite/useConnectPopupDesktop.tsx:75:                        const { method: _m, device: _d, ...safePayload } = params.payload ?? {};
suite-native/device/src/components/DeviceDangerBannerExtension.tsx:54:    const { cause } = deviceDanger ?? {};
suite-native/message-system/src/components/ContextMessage.tsx:30:    const { label, link } = cta ?? {};
packages/suite/src/components/earn/dashboard/staking/EarnStakingAccountRow.tsx:75:    const { canClaim = false } = getStakingDataForNetwork(account) ?? {};
packages/suite/src/components/suite/FormattedCryptoAmount.tsx:79:    } = getNetworkOptional(lowerCaseSymbol) ?? {};
packages/suite/src/components/earn/modals/EarnClaimModal/EarnClaimModal.tsx:58:    const { claimableAmount = '0', restakedReward = '0' } = getStakingDataForNetwork(account) ?? {};
suite-native/icons/src/TokenIcon.tsx:150:    const sourceUrls = resolvedUrls ?? [];
suite-native/module-trading/src/components/buy/BuyProviderPicker.tsx:36:    const { exchange } = selectedValue ?? {};
suite-native/module-trading/src/components/buy/BuyProviderPicker.tsx:72:    const { paymentMethod } = selectedValue ?? {};
suite-native/coin-enabling/src/components/DiscoveryCoinsFilter.tsx:75:            const enabledCoins = getValues('enabledCoins') ?? {};
packages/suite/src/components/earn/modals/UnstakeModal/UnstakeForm/UnstakeInputs.tsx:50:    } = getStakingDataForNetwork(account) ?? {};
packages/suite/src/components/earn/modals/UnstakeModal/UnstakeForm/UnstakeForm.tsx:46:    } = getStakingDataForNetwork(account) ?? {};
suite-native/module-trading/src/components/sell/payment/SellProviderPicker.tsx:36:    const { exchange } = selectedValue ?? {};
suite-native/module-trading/src/components/sell/payment/SellProviderPicker.tsx:73:    const { paymentMethod } = selectedValue ?? {};
suite-native/module-trading/src/components/general/AccountList/AccountList.tsx:77:        }) ?? [];
suite-native/module-earn/src/components/EarnDepositsCard.tsx:236:                items={stakingRow?.activeItems ?? []}
suite-native/module-earn/src/components/EarnDepositsCard.tsx:243:                items={stablecoinYieldRow?.activeItems ?? []}
suite-native/module-earn/src/components/SolanaStakingRewardsList.tsx:46:    const rewards = rewardsQuery.data?.rewards ?? [];
suite-native/module-trading/src/components/exchange/Approval/RevokeLimitInfoRow.tsx:27:    const { decimals } = findToken(sendAccount?.tokens, contractAddress) ?? {};
suite-native/module-trading/src/components/exchange/ExchangeFormQuoteDebugView.tsx:16:    const { decimals } = findToken(sendAccount?.tokens, contractAddress) ?? {};
suite-native/module-trading/src/components/exchange/ExchangeProviderPicker.tsx:30:    const { exchange } = selectedValue ?? {};
```

### C4b — same in .ts hooks/selectors files only

```
packages/product-components/src/components/SearchAsset/hooks/useNetworkSelect.ts:15:    const { networks = [], includeAllOption, allLabel, selectedNetwork } = config ?? {};
packages/suite/src/selectors/suite/suiteSelectors.ts:15:    state.suite.transport?.transports ?? [];
suite-common/wallet-core/src/tokens/tokenSelectors.ts:32:            tokens: account.tokens ?? [],
packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputBuyAsset/hooks/useAgregatedAccountsWithTokens.ts:93:                tokens: account.tokens ?? [],
packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputSellAsset/AssetPickerModal/hooks/useAccountWithTokensOptions.ts:113:                tokens: account.tokens ?? [],
packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputSellAsset/AssetPickerModal/hooks/useAccountWithTokensOptions.ts:134:                tokens: account.tokens ?? [],
suite-common/wallet-core/src/accounts/accountsSelectors.ts:313:        return account.misc.solExternalStakingAccounts ?? [];
suite-common/wallet-core/src/accounts/accountsSelectors.ts:331:        const totalLamports = (account.misc.solExternalStakingAccounts ?? []).reduce(
suite-native/tokens/src/tokensSelectors.ts:108:                    transaction?.tokens ?? [],
suite-native/tokens/src/tokensSelectors.ts:126:                    transaction?.tokens ?? [],
suite-native/tokens/src/tokensSelectors.ts:146:    return A.any(accounts, account => (account.tokens ?? []).some(token => !isNftToken(token)));
packages/suite/src/hooks/earn/useWithdrawalForm.ts:77:    const { autocompoundBalance = '0' } = getStakingDataForNetwork(account) ?? {};
suite-common/wallet-core/src/transactions/transactionsSelectors.ts:113:                response[accountKey] = (transactions[accountKey] ?? []).filter(isPending);
suite-common/wallet-core/src/transactions/transactionsSelectors.ts:285:            const accountTransactions = transactions[account.key] ?? [];
suite-common/earn-staking-api/src/staking/hooks/useSolanaRewardsHistory.ts:33:    const hasActiveStakingAccount = (account.misc?.solStakingAccounts ?? []).some(
suite-common/bluetooth/src/bluetoothSelectors.ts:19:) => returnStableArrayIfEmpty(state.bluetooth.nearbyDevices ?? []);
suite-common/bluetooth/src/bluetoothSelectors.ts:37:            const nearbyDevicesCopy = [...(nearbyDevices ?? [])];
suite-common/device/src/deviceSelectors.ts:159:    device => device?.availableTranslations ?? {},
suite-common/device/src/deviceSelectors.ts:189:    device => device?.buttonRequests ?? [],
packages/suite/src/hooks/wallet/trading/form/exchange/useTradingExchangeForm.ts:119:    const noProviders = Object.keys(exchangeInfo?.providerInfos ?? {}).length === 0;
suite-common/message-system/src/useConditionControls.ts:31:            const head = (existing[0] ?? {}) as Record<string, unknown>;
packages/suite/src/hooks/settings/backends/useDefaultUrls.ts:15:            return result.payload.blockchainLink?.url ?? [];
packages/suite/src/hooks/wallet/trading/form/sell/useTradingSellForm.ts:83:    const noProviders = Object.keys(sellInfo?.providerInfos ?? {}).length === 0;
packages/suite/src/hooks/wallet/useTotalFiatBalance.ts:17:            tokens: account.tokens ?? [],
packages/suite/src/hooks/wallet/useAccounts.ts:8:    const { addresses, descriptor, networkType, path } = account ?? {};
packages/suite/src/hooks/wallet/useAccounts.ts:9:    const { unused: unusedAddresses = [], used: usedAddresses = [] } = addresses ?? {};
packages/suite/src/hooks/wallet/useAccounts.ts:15:                return (unusedAddresses ?? []).concat(usedAddresses ?? []).reduce(
suite-common/wallet-core/src/stake/stakeSelectors.ts:53:            const poolStats = data.ada?.pools ?? [];
suite-common/trading/src/selectors/tradingSelectors.ts:472:        return getTradingCoinInfoByCryptoId(coins ?? {}, cryptoId);
suite-common/trading/src/selectors/tradingSelectors.ts:483:        return getTradingCoinSymbolByCryptoId(coins ?? {}, cryptoId);
suite-common/trading/src/selectors/tradingSelectors.ts:509:        getTradingNativeCoinSymbolByCryptoId(platforms ?? {}, coins ?? {}, cryptoId),
suite-common/trading/src/hooks/useCoinsAndPlatforms.ts:15:        const coins = infoRef.current.coins ?? {};
suite-common/trading/src/hooks/useCoinsAndPlatforms.ts:16:        const platforms = infoRef.current.platforms ?? {};
suite-native/trading-state/src/selectors/commonSelectors.ts:295:                        account.tokens ?? [],
suite-native/transaction-management/src/hooks/fees/useFeeCalculation.ts:40:    const { symbol } = account ?? {};
packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/GlobalSendModal/hooks/useAccountWithTokensOptions.ts:73:                tokens: account.tokens ?? [],
suite-native/module-stellar-token-management/src/hooks/useInactiveStellarTokens.ts:52:        const tokenAddresses = coinDefinitions?.data ?? [];
suite-native/module-accounts-management/src/hooks/useDayCoinPriceChange.ts:59:                const [weekAgo, today] = timestampedFiatRates?.tickers ?? [];
suite-native/banners/src/selectors.ts:33:        .flatMap(m => m?.feature ?? [])
suite-native/coin-enabling/src/hooks/useHasEnabledCoin.ts:11:            Object.values(enabledCoins ?? {}).some(Boolean),
suite-native/module-device-settings/src/selectors.ts:13:        ) ?? [],
suite-native/accounts/src/selectors.ts:336:            ? (account.tokens ?? []).filter(token => !hiddenSet.has(token.contract.toLowerCase()))
suite-native/accounts/src/selectors.ts:337:            : (account.tokens ?? [])
suite-native/accounts/src/selectors.ts:436:            coinDefs?.hide ?? [],
suite-native/accounts/src/selectors.ts:437:            coinDefs?.show ?? [],
suite-native/module-trading/src/hooks/general/useTradingTransaction.ts:105:    const { selectedFee } = draft ?? {};
suite-native/module-trading/src/hooks/exchange/Approval/useEvmApprovalFees.ts:46:    const { feeLimit, feePerUnit, maxFeePerGas, maxPriorityFeePerGas } = draft ?? {};
suite-native/module-trading/src/hooks/exchange/useExchangeForm.ts:132:        const { quoteId, isDex } = quote ?? {};
suite-native/module-trading/src/hooks/general/form/useTradeableAssetChange.ts:78:            const { shouldReportAnalytics = true } = options ?? {};
suite-native/module-earn/src/hooks/usePreparedTxFees.ts:281:    const localFeeLevels = feeDraftState?.feeLevels ?? {};
suite-native/module-earn/src/hooks/useComposeEarnFees.ts:139:                } = formDraftRef.current ?? {};
```

## C5 — destructuring defaults = [] / = {} (skill's worked example shape)

```
packages/suite/src/reducers/store.ts:186:    options: { statePatch?: Record<string, any> } = {},
suite-common/transaction-search/src/useFilteredUtxos.ts:9:    utxos: Utxo[] = [],
packages/react-utils/src/hooks/timer/useCountdownTimer.ts:12:    { pastDeadlineLeadMs = 1000, isEnabled = true }: UseCountdownTimerOptions = {},
suite-common/wallet-core/src/tokens/tokenUtils.ts:34:    tokens = [],
suite-common/wallet-core/src/send/__fixtures__/evmFixtures.ts:38:    } = {},
packages/suite/src/components/suite/graph/TransactionsGraph/hooks/useTransactionGraphUpdater.test.tsx:50:    transactions = [],
suite-common/wallet-core/src/device/deviceThunks.ts:523:        { skipToggleModalConnection, isOsUnpairingFinished, skipDisconnect, deviceId } = {},
suite-native/trading-history/src/components/TradeHistoryListItem/TradingDetailFeedback.test.tsx:21:        props: Partial<Parameters<typeof TradingDetailFeedback>[0]> = {},
suite-common/wallet-core/src/discovery/discoveryActions.ts:41:        }: StartDiscoveryParams = {},
suite-common/calldata/src/builder/createBuilder.ts:38:        context: unknown = {},
suite-common/wallet-core/src/stablecoin-yield/utils/stablecoinYieldDeviceUtils.ts:47:    options: StablecoinYieldSupportOptions = {},
suite-common/tx-simulation/src/hooks/useNetworkTxSimulation.ts:69:    { onSuccess }: UseTxSimulationProps = {},
suite-common/tx-simulation/src/hooks/useTxSimulation.ts:15:    { onSuccess }: Pick<UseTxSimulationProps, 'onSuccess'> = {},
suite-common/tx-simulation/src/utils/getTxSimulationRiskSummary.test.ts:10:    overrides: Partial<TransactionValidation> = {},
suite-common/tx-simulation/src/utils/getTxSimulationRiskSummary.test.ts:19:    overrides: Partial<TransactionSimulationError> = {},
packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountSection.tsx:34:        tokens: accountTokens = [],
suite-common/calldata/src/clearSigning.ts:122:    extra: ReadonlyArray<Deployment> = [],
suite-native/trading-atoms/src/hooks/useSectionList.test.tsx:12:            data = [],
suite-common/message-system/src/useExperiment.test.ts:28:    } = {},
suite-common/wallet-core/src/selectors.test.ts:54:    accounts = [],
packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AddAccountModal.tsx:328:        } = {},
suite-common/redux-extra-dependencies/src/notImplemented.ts:34:    getterArgs: any = {},
packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputSellAsset/AssetPickerModal/hooks/useAccountWithTokensOptions.ts:43:    tokens = [],
suite-common/redux-utils/src/createSingleInstanceThunk.test.ts:20:        reducer: (state = {}, action) => {
suite-common/suite-sync-quota-manager/src/challenge/mocks/createPrepareChallengeSessionDepsMock.ts:17:    patch = {},
suite-common/suite-sync-quota-manager/src/device/mocks/createEnsureDeviceHasQuotaDepsMock.ts:19:    patch = {},
packages/suite/src/views/wallet/trading/common/TradingTransactions/TradingTransactionsList.test.tsx:111:    trades = [],
suite-common/suite-sync-quota-manager/src/device/mocks/createEnsureOwnerHasAllocatedQuotaDepsMock.ts:16:    patch = {},
packages/suite/src/views/settings/SettingsCoins/useNetworkSettingsSearch.ts:16:    { origin = 'network-settings' }: UseNetworkSettingsSearchOptions = {},
suite-common/suite-sync/src/data/labeling/fromSuiteSyncToSearchAccountLabels.ts:11:    outputLabels: SuiteSyncOutput[] = [],
suite-common/suite-sync/src/data/labeling/fromSuiteSyncToSearchAccountLabels.ts:26:    addressLabels: SuiteSyncAddress[] = [],
suite-common/bluetooth/src/bluetoothActions.ts:84:        } = {},
suite-common/suite-sync/src/suiteSyncSelectors.test.ts:18:    deviceOverrides: Parameters<typeof mockSuiteDevice>[0] = {},
suite-common/suite-sync/src/suiteSyncSelectors.test.ts:19:    suiteSyncOverrides: Partial<SuiteSyncState> = {},
suite-common/suite-sync/src/createEnsureSuiteSyncKeys.test.ts:34:    overrides: Partial<TrezorDevice> = {},
suite-common/suite-sync/src/createEnsureSuiteSyncKeys.test.ts:35:    deviceStateOverrides: Partial<TrezorDevice['state']> | null = {},
suite-common/suite-sync/src/owner/createEnsureSuiteSyncOwner.test.ts:28:    overrides: Partial<CreateEnsureSuiteSyncOwnerDeps> = {},
suite-native/module-send/src/hooks/useAddressValidationAlerts/useAddressValidationAlerts.test.tsx:93:        { inputIndex = 0 } = {},
suite-common/connect-init/src/connectInitThunks.test.ts:47:    services: Partial<ConnectInitThunkDeps['services']> = {},
packages/suite/src/views/wallet/transactions/TransactionList/useFetchTransactions.ts:75:            } = {},
packages/suite/src/views/wallet/transactions/TransactionList/useFetchTransactions.ts:99:            } = {},
packages/suite/src/actions/settings/deviceSettingsActions.ts:44:    (params: Parameters<typeof TrezorConnect.changePin>[0] = {}, skipSuccessToast?: boolean) =>
suite-common/wallet-config/src/earnRewardsProvider.ts:15:    { isDebugMode = false }: { isDebugMode?: boolean } = {},
suite-common/trading/src/tradeApi.ts:145:        body: BodyType = {},
suite-common/trading/src/tradeApi.ts:174:        body: BodyType = {},
packages/suite/src/actions/suite/suiteForgetDeviceThunk.ts:25:        }: ForgetDeviceThunkParams | undefined = {},
suite-common/wallet-utils/src/stakingUtils.ts:280:    { withdrawTime, exitTime }: GetUnstakingPeriodInDays = {},
suite-common/earn-stablecoin-api/src/hooks/merkl-rewards/useGetMerklRewardsQueryEntries.ts:75:    { isDebugMode, skipEmptyAccountCheck = false }: MerklRewardsQueryEntriesOptions = {},
suite-common/earn-stablecoin-api/src/hooks/merkl-rewards/useGetMerklRewardsQueryEntries.ts:94:    { isDebugMode, skipEmptyAccountCheck }: MerklRewardsQueryEntriesOptions = {},
suite-common/earn-stablecoin-api/src/hooks/merkl-rewards/useExtendMerklRewardsWithFiat.ts:24:    chainsRewards: MerklChainsRewards = [],
packages/suite/src/hooks/suite/useMessageSystemYield.ts:13:    options: UseMessageSystemYieldOptions = {},
suite-common/trading/src/utils/exchange/resolveExchangeTradeError.ts:56:    { getCoinSymbol }: ResolveTradeErrorOptions = {},
suite-common/wallet-utils/src/ethUtils.test.ts:315:            targets = [],
suite-common/wallet-utils/src/ethUtils.test.ts:316:            internalTransfers = [],
suite-common/wallet-utils/src/ethUtils.test.ts:364:            targets = [],
suite-common/wallet-utils/src/ethUtils.test.ts:365:            internalTransfers = [],
suite-common/trading/src/utils/exchange/getSimulatedReceiveAmount.test.ts:27:    { simulationStatus = 'Success' }: { simulationStatus?: 'Success' | 'Error' } = {},
suite-common/wallet-utils/src/accountUtils.ts:380:    { addresses, history: { transactions = [] }, page }: AccountInfo,
suite-common/wallet-utils/src/tronUtils.test.ts:31:    overrides: Partial<TronAccountExtraData> = {},
suite-native/module-send/src/utils.ts:16:    selectedUtxos = [],
suite-common/wallet-utils/src/solanaStakingUtils.test.ts:10:    overrides: Partial<SolanaStakingAccount> = {},
suite-native/module-send/src/selectors.test.ts:8:    overrides: Partial<NativeSendRootState['wallet']['send']> = {},
suite-common/wallet-utils/src/tronStakingUtils.test.ts:400:    overrides: Partial<TronAccountExtraData> = {},
packages/suite/src/actions/wallet/blockchainActions.test.ts:51:    { accounts, transactions, blockchain, fees }: Args = {},
suite-common/suite-sync-storage/mocks/mockSuiteSyncStorage.ts:18:    overrides: MockSuiteSyncStorageOverrides = {},
suite-common/earn-staking-api/src/staking/hooks/useEthereumValidatorsQueue.ts:21:    > = {},
suite-common/earn-staking-api/src/staking/hooks/useSolStakingRewardsWarning.ts:11:    { limit = 1 }: UseSolStakingRewardsWarningOptions = {},
suite-native/trading-analytics/src/hooks/useExchangeAnalyticReportCallback.test.ts:29:        overrides: PreloadedStatePartial<ExchangeAnalyticsPreloadedState> = {},
suite-native/trading-analytics/src/hooks/useBuyAnalyticReportCallback.test.ts:27:        overrides: PreloadedStatePartial<BuyAnalyticsPreloadedState> = {},
packages/suite/src/hooks/wallet/trading/form/buy/useBuyQuotes.test.tsx:85:    options: { resolver?: Resolver<TradingBuyFormProps> } = {},
suite-native/transaction-management/src/hooks/fees/useFeeSelection.ts:40:            }: CustomFeeParams = {},
packages/suite/src/hooks/wallet/trading/form/exchange/useExchangeDexQuote.test.tsx:60:    overrides: Partial<TradingExchangeFormProps> = {},
packages/suite/src/hooks/wallet/trading/form/exchange/useExchangeDexQuote.test.tsx:100:    dexQuotes = [],
packages/suite/src/hooks/wallet/trading/form/exchange/useExchangeQuotes.test.tsx:151:    } = {},
packages/suite/src/hooks/wallet/trading/form/sell/useSellQuotes.test.tsx:132:    options: { resolver?: Resolver<TradingSellFormProps> } = {},
suite-native/atoms/src/Text.tsx:96:            style = {},
suite-native/atoms/src/Sheet/BottomSheetModal.tsx:62:            bottomSheetCustomProps = {},
packages/suite/src/hooks/wallet/useEvmNonceInfo.ts:41:    { enabled = true }: UseEvmNonceInfoOptions = {},
suite-native/atoms/src/DiscreetText/DiscreetText.tsx:31:    style = {},
suite-native/discovery/src/discoverySelectors.test.ts:46:    overrides: PreloadedStatePartial<StateFromReducersMapObject<typeof reducer>> = {},
suite-native/transaction-management/src/components/ReviewOutputItemList/ReviewOutputItemValues.test.tsx:12:        props: Partial<ReviewOutputItemValuesProps> = {},
suite-native/transaction-management/src/components/ReviewOutputItemList/ReviewOutputItemValues.test.tsx:13:        preloadedState = {},
suite-native/graph/src/components/Graph.tsx:78:    points = [],
suite-native/transaction-management/src/__fixtures__/feeLevels.ts:5:    overrides: Partial<PrecomposedTransactionFinal> = {},
suite-native/transaction-management/src/selectors.test.ts:25:    overrides: Partial<NativeSendRootState['wallet']['send']> = {},
suite-native/formatters/src/components/AmountText.tsx:18:    style = {},
suite-native/module-trading/src/components/reviewOutputs/ReviewOutputsFooter.test.tsx:14:        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/state/src/receivePersistTransform.ts:6:    accounts: ReceiveState['accounts'] = {},
suite-native/module-trading/src/components/buy/BuyFiatAmountInput.test.tsx:18:        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/buy/BuyFiatAmountInput.test.tsx:28:        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/buy/BuyCryptoAmountInput.test.tsx:21:        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/buy/BuyCryptoAmountInput.test.tsx:31:        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/hooks/general/useTradingFiatValues.test.ts:28:    walletOverrides: Record<string, unknown> = {},
suite-native/module-trading/src/hooks/general/useWatchTrade.test.ts:70:        trades = [],
suite-native/module-trading/src/hooks/general/useWatchTrade.test.ts:71:        accounts = [],
suite-native/module-trading/src/hooks/general/form/useContextForTradingForm.test.ts:14:        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/screens/TradingExchangePreviewScreen.test.tsx:96:    payload: Partial<SimulationResult['payload']> = {},
suite-native/module-trading/src/screens/TradingConfirmingScreen.test.tsx:104:        routeProps: Partial<RootStackParamList[RootStackRoutes.TradingConfirming]> = {},
suite-native/module-trading/src/components/buy/BuyPaymentMethodPicker.test.tsx:62:        componentPreloadedState: PreloadedStatePartial<typeof defaultPreloadedState> = {},
suite-native/module-trading/src/hooks/exchange/useExchangeSignTransaction.test.ts:52:    overrides = {},
suite-native/module-trading/src/components/buy/BuyProviderPicker.test.tsx:34:        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/buy/BuyFormFieldErrorBadge.test.tsx:24:        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/buy/BuyFormFieldErrorBadge.test.tsx:36:        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-settings/src/components/FaqCard.tsx:18:    values = {},
suite-native/module-trading/src/components/concierge/ConciergeAlert.test.tsx:60:    errors = {},
suite-native/module-trading/src/components/concierge/ConciergeAlert.test.tsx:61:    values = {},
suite-native/trading-fixtures/src/__fixtures__/precomposedTransaction.ts:8:    overrides: Partial<PrecomposedTransactionFinal> = {},
suite-native/module-earn/src/unstakeFormSchema.test.ts:19:    overrides: Partial<SolanaStakingAccount> = {},
suite-native/module-trading/src/components/concierge/ConciergeTabContent.test.tsx:41:    overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/general/MyAssetSheet/MyAssetListItem.test.tsx:89:        }: Partial<MyAssetListItemProps> = {},
suite-native/module-earn/src/utils/getWrappedNativeYieldVaults.ts:21:    vaults = [],
suite-native/accounts/src/selectors.ts:324:    hiddenContracts: string[] = [],
suite-native/accounts/src/selectors.ts:325:    shownContracts: string[] = [],
suite-native/staking/src/stakeNativeThunks.test.ts:134:    formDrafts = {},
suite-native/staking/src/stakeNativeThunks.test.ts:135:    blockchain = {},
suite-native/module-earn/src/hooks/useEarnDepositsCardData.test.ts:21:    overrides: Partial<Pick<ReturnType<typeof useMissingRateTickersQuery>, 'isFetching'>> = {},
suite-native/module-earn/src/hooks/useEarnDepositsCardData.test.ts:65:    stakingItems = [],
suite-native/module-earn/src/hooks/useMessageSystemYield.ts:13:    options: UseMessageSystemYieldOptions = {},
suite-native/module-trading/src/components/general/TradingCoinAmountFormatter.test.tsx:13:        props: Partial<TradingCoinAmountFormatterProps> = {},
suite-native/staking/src/stakeFormEthereumNativeThunks.test.ts:89:    overrides: Partial<PrecomposedTransactionFinal> = {},
suite-native/staking/src/stakeFormEthereumNativeThunks.test.ts:140:    formDrafts = {},
suite-native/module-trading/src/components/general/ProviderSheet/ProviderSheetHandle.test.tsx:26:        props: Partial<ProviderSheetHandleProps> = {},
suite-native/module-trading/src/components/general/ProviderSheet/ProviderSheetHandle.test.tsx:27:        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/general/TradeableAssetAccountBalance.test.tsx:20:        props: Partial<TradeableAssetAccountBalanceProps> = {},
suite-native/module-trading/src/components/general/TradeableAssetAccountBalance.test.tsx:21:        preloadedState = {},
suite-native/module-trading/src/components/general/ProviderSheet/ProviderSheet.test.tsx:19:        props: Partial<ProviderSheetProps<TradingType, TradingTradeType>> = {},
suite-native/module-trading/src/components/general/ProviderSheet/ProviderSheet.test.tsx:20:        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/general/HistoryButton.test.tsx:30:        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-earn/src/components/SolanaUnstakeAmountBoundsAlert.test.tsx:18:    overrides: Partial<SolanaStakingAccount> = {},
suite-native/module-trading/src/components/exchange/Approval/RevokeLimitInfoRow.test.tsx:14:        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/exchange/ExchangePickersCard.test.tsx:41:        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/exchange/receive/ExchangeReceiveAmountInput.test.tsx:31:        props: Partial<ExchangeReceiveAmountInputProps> = {},
suite-native/module-trading/src/components/exchange/receive/ExchangeReceiveAmountInput.test.tsx:32:        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/exchange/send/ExchangeSendAmountInput.test.tsx:44:        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/exchange/send/ExchangeSendAmountInput.test.tsx:57:        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/exchange/ExchangeRateAndProviderPicker.test.tsx:37:        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/exchange/ExchangePreview/ExchangeInfo.test.tsx:19:        props: Partial<ExchangeInfoProps> = {},
suite-native/module-trading/src/components/exchange/send/ExchangeSendAmountBadge.test.tsx:27:        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/exchange/ExchangePreview/ExchangeToAccountTradePreviewCard.test.tsx:13:        props: Partial<ExchangeToAccountTradePreviewCardProps> = {},
suite-native/module-trading/src/components/sell/SellKYCWarning.test.tsx:16:        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/sell/SellForm.test.tsx:46:        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/exchange/ExchangePreview/ExchangePreviewContinueButton.test.tsx:51:        props: Partial<ExchangePreviewContinueButtonProps> = {},
suite-native/module-trading/src/components/exchange/ExchangePreview/ExchangePreviewContinueButton.test.tsx:52:        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/sell/payment/SellProviderPicker.test.tsx:33:        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/exchange/ExchangePreview/ExchangePreviewFooter.test.tsx:73:        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/sell/SellPreview/SellPreviewView.test.tsx:53:        props: Partial<SellPreviewViewProps> = {},
suite-native/module-trading/src/components/exchange/ExchangePreview/ExchangePreviewIssueBanner.test.tsx:44:    { isSimulationEnabled = true, isSimulation = true } = {},
suite-native/module-trading/src/components/sell/SellPreview/SellPreviewContinueButton.test.tsx:44:        props: Partial<SellPreviewContinueButtonProps> = {},
suite-native/module-trading/src/components/sell/SellPreview/SellPreviewContinueButton.test.tsx:45:        extraOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/sell/send/SellSendAmountInput.test.tsx:33:        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/sell/send/SellSendAmountInput.test.tsx:43:        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/sell/SellPreview/SellFromAccountTradePreviewCard.test.tsx:13:        props: Partial<SellFromAccountTradePreviewCardProps> = {},
suite-native/module-trading/src/components/exchange/ExchangePreview/ExchangeFromAccountTradePreviewCard.test.tsx:13:        props: Partial<ExchangeFromAccountTradePreviewCardProps> = {},
suite-native/module-trading/src/components/sell/fiat/SellReceiveMethodPicker.test.tsx:37:        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
suite-native/module-trading/src/components/sell/SellPreview/SellInfo.test.tsx:18:        props: Partial<SellInfoProps> = {},
suite-native/module-trading/src/components/sell/SellPreview/SellToFiatTradePreviewCard.test.tsx:16:        props: Partial<SellToFiatTradePreviewCardProps> = {},
```

## C6 — Provider value={{ (inline context value, web packages only)

```
packages/components/src/components/Banner/Banner.tsx:140:                        <BannerContext.Provider value={{ intent }}>
packages/components/src/components/Collapsible/Collapsible.tsx:33:        <CollapsibleContext.Provider
packages/components/src/components/Collapsible/Collapsible.tsx:34:            value={{
packages/components/src/components/List/List.tsx:84:        <ListContext.Provider
packages/components/src/components/List/List.tsx:85:            value={{ bulletGap, bulletAlignment, bulletComponent, listStyleType }}
packages/components/src/components/Modal/Modal.tsx:95:        <ModalContext.Provider value={{ intent }}>
packages/components/src/components/Modal/ModalButton.tsx:15:        <ModalContext.Provider value={{ intent: modalIntent }}>
packages/components/src/components/Modal/ModalProvider.tsx:38:        <ModalContext.Provider
packages/components/src/components/Modal/ModalProvider.tsx:39:            value={{
packages/components/src/components/StepList/StepList.tsx:63:        <StepListContext.Provider
packages/components/src/components/StepList/StepList.tsx:64:            value={{
packages/components/src/components/SubTabs/SubTabs.tsx:34:        <SubTabsContext.Provider value={{ activeItemId, size }}>
packages/components/src/components/Table/Table.tsx:68:        <TableContext.Provider value={{ isRowHighlightedOnHover, hasBorders, typographyStyle }}>
packages/components/src/components/Tabs/Tabs.tsx:108:        <TabsContext.Provider value={{ activeItemId, isDisabled, size, setTabRef }}>
packages/suite/src/components/onboarding/OnboardingCancelButtonContext.tsx:19:        <CancelButtonContext.Provider value={{ onCancelHandler, setOnCancelHandler }}>
packages/suite/src/components/suite/layouts/SuiteLayout/SuiteLayout.tsx:113:        <ScrollContext.Provider value={{ scrollRef, topOffset }}>
packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/TxDetailModal/CancelTransaction/CancelTransactionModal.tsx:110:        <CancelTxContext.Provider
packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/TxDetailModal/CancelTransaction/CancelTransactionModal.tsx:111:            value={{ composedCancelTx, cancelFormState: formState, isComposing }}
packages/suite/src/components/wallet/Fees/CollapsibleFees/CollapsibleFees.tsx:76:        <FeesContext.Provider
packages/suite/src/components/wallet/Fees/CollapsibleFees/CollapsibleFees.tsx:77:            value={{
packages/suite/src/hooks/suite/useAccountSearch.tsx:48:        <AccountSearchContext.Provider
packages/suite/src/hooks/suite/useAccountSearch.tsx:49:            value={{
packages/suite/src/support/suite/AccountHeaderProvider.tsx:22:        <AccountHeaderContext.Provider value={{ balanceSectionRef }}>
```

## C7 — JSON.stringify used as/inside a dep array

```
suite-common/tx-simulation/src/utils/getTxSimulationParams.ts:68:            params: [fromAddress, JSON.stringify(data)],
```

## C8 — useFreshRef / useCurrentRef call sites (class-7 review list)

```
packages/react-utils/src/hooks/useAsyncMemo.ts:20:    const getValueRef = useFreshRef(getValue);
packages/react-utils/src/hooks/useFreshRef.test.ts:13:        const { result, rerender } = renderHook(({ value }) => useFreshRef(value), {
packages/react-utils/src/hooks/useFreshRef.test.ts:25:        const { result, rerender } = renderHook(({ value }) => useFreshRef(value), {
packages/react-utils/src/hooks/useFreshRef.test.ts:7:        const { result } = renderHook(() => useFreshRef('first'));
packages/suite/src/components/dashboard/DashboardSection.tsx:41:        const collapseChangeRef = useCurrentRef(onCollapseChange);
packages/suite/src/components/earn/yield/common/useWrappedNativeFlowAnalytics.ts:92:    const latestRef = useCurrentRef({ status, networkSymbol });
packages/suite/src/components/earn/yield/hooks/useYieldFlow.ts:149:    const methodsRef = useCurrentRef(methods);
packages/suite/src/components/earn/yield/hooks/useYieldFlow.ts:158:    const allowanceFlowDataRef = useCurrentRef({
packages/suite/src/components/earn/yield/hooks/useYieldFlow.ts:167:    const sessionRef = useCurrentRef(session);
packages/suite/src/components/earn/yield/hooks/useYieldFlow.ts:174:    const hasWrappedTokenBalanceRef = useCurrentRef(hasWrappedTokenBalance);
packages/suite/src/components/earn/yield/hooks/useYieldPendingTransactionTracking.ts:214:    const latestRef = useCurrentRef({
packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/GlobalSendModal/GlobalSendModal.tsx:61:    const submitRef = useCurrentRef(onSubmit);
packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/GlobalSendModal/hooks/useAccountWithTokensOptions.ts:57:    const fiatRatesRef = useCurrentRef(fiatRates);
packages/suite/src/hooks/suite/useProxyImage.ts:42:    const inProgressRef = useCurrentRef(proxyImageQuery.isLoading);
packages/suite/src/hooks/wallet/allowance/useAllowanceCompose.ts:137:    const composeRequestRef = useCurrentRef(composeRequest);
packages/suite/src/hooks/wallet/allowance/useAllowanceCompose.ts:67:    const methodsRef = useCurrentRef(methods);
packages/suite/src/hooks/wallet/allowance/useAllowanceModal.ts:94:    const composeRequestRef = useCurrentRef(composeRequest);
packages/suite/src/hooks/wallet/allowance/useAllowanceModal.ts:95:    const onSelectApprovalTypeRef = useCurrentRef(onSelectApprovalType);
packages/suite/src/hooks/wallet/allowance/useAllowanceModal.ts:96:    const onConfirmRef = useCurrentRef(onConfirm);
packages/suite/src/hooks/wallet/allowance/useAllowanceModal.ts:97:    const onCancelRef = useCurrentRef(onCancel);
packages/suite/src/hooks/wallet/allowance/useAllowanceSend.ts:25:    const methodsRef = useCurrentRef(methods);
packages/suite/src/hooks/wallet/allowance/useAllowanceSend.ts:26:    const accountRef = useCurrentRef(account);
packages/suite/src/hooks/wallet/trading/form/common/useTradingFindAccountOrToken.ts:56:    const findAccountOrTokenRef = useCurrentRef(findAccountOrToken);
packages/suite/src/hooks/wallet/trading/form/common/useTradingQuoteRequest.ts:36:    const configRef = useCurrentRef(config);
packages/suite/src/hooks/wallet/trading/form/exchange/useExchangeDexQuote.ts:130:    const fetchFeesAndComposeRef = useCurrentRef(fetchFeesAndCompose);
packages/suite/src/hooks/wallet/trading/form/exchange/useExchangeDexQuote.ts:62:    const accountRef = useCurrentRef(account);
packages/suite/src/hooks/wallet/trading/form/exchange/useExchangeDexQuote.ts:63:    const composeRequestRef = useCurrentRef(composeRequest);
packages/suite/src/hooks/wallet/trading/form/sell/useTradingSellFormRedirectValues.ts:53:    const findAccountRef = useCurrentRef(findAccount);
packages/suite/src/views/wallet/staking/components/SolStakingDashboard/SolStakingDashboard.tsx:70:    const pagintionRef = useCurrentRef(pagination);
packages/suite/src/views/wallet/trading/common/TradingForm/TradingBuyFormInputs.tsx:57:    const setAmountLimitsRef = useCurrentRef(setAmountLimits);
packages/suite/src/views/wallet/trading/common/TradingForm/TradingBuyFormInputs.tsx:58:    const setValueRef = useCurrentRef(setValue);
packages/suite/src/views/wallet/trading/common/TradingForm/TradingExchangeFormInputs.tsx:109:    const setAmountLimitsRef = useCurrentRef(setAmountLimits);
packages/suite/src/views/wallet/trading/common/TradingForm/TradingExchangeFormInputs.tsx:110:    const setValueRef = useCurrentRef(setValue);
packages/suite/src/views/wallet/trading/common/TradingForm/TradingExchangeFormInputs.tsx:112:    const onCryptoCurrencyChangeRef = useCurrentRef(helpers.onCryptoCurrencyChange);
packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputBuyAsset/hooks/useAgregatedAccountsWithTokens.ts:59:    const fiatRatesRef = useCurrentRef(fiatRates);
packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputSellAsset/AssetPickerModal/hooks/useAccountWithTokensOptions.ts:90:    const fiatRatesRef = useCurrentRef(fiatRates);
packages/suite/src/views/wallet/trading/common/TradingForm/TradingSellFormInputs.tsx:90:    const onCryptoCurrencyChangeRef = useCurrentRef(helpers.onCryptoCurrencyChange);
suite-common/earn-stablecoin-api/src/hooks/merkl-rewards/useGetMerklRewards.ts:29:    const queryEntriesRef = useFreshRef(queryEntries);
suite-common/earn-stablecoin-api/src/hooks/merkl-rewards/useGetMerklRewards.ts:30:    const chainsRewardsRef = useFreshRef(queryResult.data);
suite-common/trading/src/hooks/useApprovalStep.ts:40:    const refreshQuotesRef = useCurrentRef(refreshQuotes);
suite-common/trading/src/hooks/useCoinsAndPlatforms.ts:12:    const infoRef = useFreshRef(info);
```

## C9 — files with useEffect keyed on whole account/device/transaction object (agents grep inside)

```
packages/suite/src/components/earn/staking/tron/hooks/useTronStakeFlow.ts
packages/suite/src/components/earn/staking/tron/hooks/useTronStakePendingTransactionTracking.ts
packages/suite/src/components/earn/yield/hooks/useYieldPendingTransactionTracking.ts
packages/suite/src/components/suite/banners/SuiteBanners/SuiteBanners.tsx
packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/AddTokenModal.tsx
packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/ConfirmUnverifiedModal.tsx
packages/suite/src/hooks/suite/useFirmwareUpgradeModal.ts
packages/suite/src/hooks/wallet/trading/form/common/useTradingCryptoAssetChange.ts
packages/suite/src/hooks/wallet/trading/form/exchange/useExchangeDexQuote.ts
packages/suite/src/hooks/wallet/trading/useTradingDetail.ts
packages/suite/src/hooks/wallet/useEthereumCancelTxCompose.ts
packages/suite/src/views/onboarding/index.tsx
packages/suite/src/views/suite/SwitchDevice/DeviceItem/DeviceItem.tsx
packages/suite/src/views/wallet/nfts/index.tsx
packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/CoinControl.tsx
packages/suite/src/views/wallet/send/Outputs/TokenSelect/TokenSelect.tsx
packages/suite/src/views/wallet/staking/components/SolStakingDashboard/SolStakingDashboard.tsx
packages/suite/src/views/wallet/staking/components/StakingDashboard/components/ClaimCard.tsx
packages/suite/src/views/wallet/tokens/TokensNavigation.tsx
packages/suite/src/views/wallet/tokens/index.tsx
packages/suite/src/views/wallet/transactions/TransactionList/TransactionList.tsx
packages/suite/src/views/wallet/transactions/TransactionList/TransactionListActions/TransactionListActions.tsx
suite-common/trading/src/hooks/useTradingExchangeWatchApproval.ts
suite-native/accounts/src/hooks/useResolvedAccountKey.ts
suite-native/module-accounts-management/src/screens/AccountDetailContentScreen.tsx
suite-native/module-earn/src/hooks/useComposeEarnFees.ts
suite-native/module-send/src/hooks/useSendForm.tsx
suite-native/module-trading/src/components/exchange/Approval/ExchangeApprovalDetails.tsx
suite-native/module-trading/src/components/exchange/Approval/ExchangeRevokeDetails.tsx
suite-native/module-trading/src/hooks/exchange/Approval/useEvmApprovalFees.ts
suite-native/module-transactions/src/screens/TransactionDetailScreen.tsx
```

## C10 — files where a useEffect body starts with setState (derived-state / loop candidates)

```
packages/components/src/components/Modal/ModalProvider.tsx
packages/components/src/components/PinInput/PinInput.tsx
packages/components/src/components/VirtualizedList/VirtualizedList.tsx
packages/components/src/utils/useScrollShadow.tsx
packages/product-components/src/components/EditableText/EditableText.tsx
packages/product-components/src/components/EmojiRatingSelector/EmojiRatingSelector.stories.tsx
packages/suite/src/components/onboarding/ThpPairingStep/ThpPairingStartStep.tsx
packages/suite/src/components/suite/banners/SuiteBanners/SuiteBanners.tsx
packages/suite/src/components/suite/bluetooth/BluetoothDebugInfo.tsx
packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/hooks/useGlobalSendReceiveModal.ts
packages/suite/src/hooks/settings/backends/useBackendsForm.ts
packages/suite/src/hooks/suite/useLayout.tsx
packages/suite/src/hooks/wallet/trading/form/buy/useTradingBuyForm.ts
packages/suite/src/hooks/wallet/trading/form/useTradingVerifyAccount.ts
packages/suite/src/hooks/wallet/useSendForm.test.tsx
packages/suite/src/views/settings/SettingsGeneral/DustPhishing.tsx
packages/suite/src/views/wallet/send/Outputs/Address.tsx
packages/suite/src/views/wallet/send/Outputs/Amount/Amount.tsx
packages/suite/src/views/wallet/tokens/TokensNavigation.tsx
packages/suite/src/views/wallet/transactions/TransactionList/TransactionListActions/TransactionListActions.tsx
packages/suite/src/views/wallet/transactions/TransactionList/useFetchTransactions.ts
suite-common/device/src/usePinHook.ts
suite-native/accounts/src/components/AccountsListWithFilter.tsx
suite-native/accounts/src/components/NetworkFilterBottomSheet.tsx
suite-native/atoms/src/Button/TextButton.tsx
suite-native/module-earn/src/hooks/useYieldAllowanceFees.ts
suite-native/module-earn/src/hooks/useYieldApprovalLimit.tsx
suite-native/module-send/src/components/TronNoteInput.tsx
suite-native/module-trading/src/hooks/buy/useBuyForm.ts
suite-native/module-trading/src/hooks/exchange/useExchangeForm.ts
suite-native/module-trading/src/hooks/general/form/useReceiveAccountChangeEffect.ts
suite-native/module-trading/src/hooks/general/form/useSendAccountAssetBalance.ts
suite-native/module-trading/src/hooks/general/form/useSendAccountChangeEffect.ts
suite-native/module-trading/src/hooks/sell/useSellForm.ts
suite-native/trading-residence/src/components/ConfirmLocationButton.test.tsx
suite-native/transaction-management/src/hooks/fees/useCustomFee.ts
```
