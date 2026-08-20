# Phase 0 — raw candidate harvest (grep, unverified)

Generated mechanically; every hit below still needs human/agent verification against
[`skills/performance-dom/SKILL.md`](../../../skills/performance-dom/SKILL.md).
Scope: `packages/`, `suite/`, `suite-common/` — web/desktop only. `suite-native/`,
tests, stories, e2e, fixtures and mocks are excluded.

Regenerate with the script embedded in the PROGRESS.md history (harvest.sh).

## A. Forced-layout geometry reads

### A1. getBoundingClientRect / getClientRects

```
suite/router/src/useAnchor.ts:22:        // unlike getBoundingClientRect which forces a synchronous layout. It reports once
packages/components/src/components/form/Range/Range.tsx:199:        setLabelsElWidth(lastLabelRef.current?.getBoundingClientRect().width);
packages/components/src/components/Tabs/Tabs.tsx:86:        const width = activeItemEl?.getBoundingClientRect()?.width;
packages/components/src/components/ResizableBox/ResizableBox.tsx:323:            const rect = resizableBoxRef.current.getBoundingClientRect();
packages/components/src/components/ResizableBox/ResizableBox.tsx:457:                const rect = resizableBoxRef.current.getBoundingClientRect();
suite/discreet-mode/src/HiddenPlaceholder.tsx:96:            setWrapperMinWidth(ref.current.getBoundingClientRect().width);
packages/analytics-docs/src/app/scroll.ts:17:    const containerRect = container.getBoundingClientRect();
packages/analytics-docs/src/app/scroll.ts:18:    const elRect = el.getBoundingClientRect();
packages/suite/src/components/suite/graph/TransactionsGraph/GraphYAxisTick.tsx:34:            const rect = ref.current.getBoundingClientRect();
packages/suite/src/components/suite/layouts/SuiteLayout/useResponsiveContextOnChange.tsx:37:        const rect = ref.current.getBoundingClientRect();
```

### A2. offset$x reads

```
packages/components/src/components/Tabs/Tabs.tsx:87:        const position = activeItemEl?.offsetLeft;
packages/suite/src/components/suite/FindBar/highlight.ts:20:    if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return false;
```

### A3. client$x reads

```
packages/connect-explorer-theme/src/components/sidebar.tsx:154:                            {/* without asPopover check <Collapse />'s inner.clientWidth on `layout: "raw"` will be 0 and element will not have width on initial loading */}
packages/connect-explorer-theme/src/components/collapse.tsx:37:            inner.style.width = `${inner.clientWidth}px`;
packages/connect-explorer-theme/src/components/collapse.tsx:38:            container.style.width = `${inner.clientWidth}px`;
packages/connect-explorer-theme/src/components/collapse.tsx:40:            container.style.height = `${inner.clientHeight}px`;
packages/suite/src/views/wallet/staking/components/StakingDashboard/components/ProgressLabels/ProgressLabel.tsx:127:            const clientHeight = ref.current?.clientHeight ?? DEFAULT_LABEL_HEIGHT;
```

### A4. scroll$x geometry props (read or write)

```
suite/router/src/useAnchor.ts:38:                    scrollContainer.scrollTop;
packages/analytics-docs/src/app/scroll.ts:19:    const nextTop = elRect.top - containerRect.top + container.scrollTop - offsetTop;
packages/product-components/src/components/EditableText/EditableText.tsx:252:            valueRef.current.scrollLeft = 0;
packages/product-components/src/components/EditableText/EditableText.tsx:287:                valueRef.current.scrollLeft = 0;
packages/product-components/src/components/EditableText/EditableText.tsx:310:            valueRef.current.scrollLeft = 0;
packages/components/src/components/VirtualizedList/VirtualizedList.tsx:131:        containerRef.current.scrollTop = 0;
packages/components/src/components/typography/TruncateWithTooltip/TruncateWithTooltip.tsx:27:            const scrollWidth = containerRef.current?.scrollWidth ?? null;
packages/components/src/components/typography/TruncateWithTooltip/TruncateWithTooltip.tsx:28:            const scrollHeight = containerRef.current?.scrollHeight ?? null;
packages/suite/src/hooks/suite/useResetScrollOnUrl.ts:28:        current.scrollTop = 0; // reset scroll position on url change
```

### A5. scroll methods

```
suite/router/src/useAnchor.ts:41:                    scrollContainer.scrollTo({
packages/suite/src/views/onboarding/steps/SelectBackupType/FloatingSelections.tsx:134:                                legacyOptionsRef?.current?.scrollIntoView({
packages/connect-explorer-theme/src/components/back-to-top.tsx:8:    window.scrollTo({ top: 0, behavior: 'smooth' });
packages/connect-explorer-theme/src/components/toc.tsx:5:import scrollIntoView from 'scroll-into-view-if-needed';
packages/connect-explorer-theme/src/components/toc.tsx:47:            scrollIntoView(anchor, {
packages/components/src/components/form/Select/customComponents.tsx:180:            ref.current?.scrollIntoView({ block: 'nearest' });
packages/connect-explorer-theme/src/components/sidebar.tsx:10:import scrollIntoView from 'scroll-into-view-if-needed';
packages/connect-explorer-theme/src/components/sidebar.tsx:71:                scrollIntoView(activeElement, {
packages/analytics-docs/src/App.tsx:143:            el.scrollIntoView({ block: 'start', behavior: 'instant' });
packages/analytics-docs/src/app/scroll.ts:20:    container.scrollTo({ top: Math.max(0, nextTop), behavior });
packages/suite/src/views/wallet/staking/components/SolStakingDashboard/Rewards/RewardsList.tsx:36:            sectionRef.current.scrollIntoView();
packages/suite/src/views/wallet/transactions/TransactionList/TransactionList.tsx:121:            sectionRef.current.scrollIntoView();
packages/suite/src/components/guide/GuideMarkdown.tsx:21:            ref.current.parentElement?.parentElement?.scrollTo(0, 0);
packages/suite/src/components/suite/asset-picker/hooks/useListScrollReset.ts:8:        listRef.current?.scrollTo({ top: 0, behavior: 'instant' });
packages/suite/src/components/suite/FindBar/useFindInPage.ts:68:    const applyActiveOrdinal = useCallback((ord: number | null, scrollIntoView = false) => {
packages/suite/src/components/suite/FindBar/useFindInPage.ts:88:        if (scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/AssetSearchWithNetworkFilter/hooks/useNetworkFilter.ts:65:            listRef.current?.scrollTo({ top: 0, behavior: 'instant' });
packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputList.tsx:139:            totalOutputRef.current?.scrollIntoView({ behavior: signedTx ? 'instant' : 'smooth' });
packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputList.tsx:141:            outputRefs.current[reviewStep]?.scrollIntoView({ behavior: 'smooth' });
```

### A6. innerText

```
packages/connect-examples/webextension/src/connect-manager.ts:18:                    result.innerText = JSON.stringify(response);
packages/connect-examples/webextension/src/connect-manager.ts:24:                    result.innerText = 'Error: ' + response.error;
packages/connect-examples/webextension/src/connect-manager.ts:41:                    result.innerText = JSON.stringify(response);
packages/connect-examples/webextension/src/connect-manager.ts:47:                    result.innerText = 'Error: ' + response.error;
```

### A7. getComputedStyle

```
suite/discreet-mode/src/HiddenPlaceholder.tsx:83:                .getComputedStyle(ref.current, null)
packages/suite/src/components/suite/FindBar/highlight.ts:20:    if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return false;
packages/suite/src/components/suite/FindBar/highlight.ts:21:    const style = getComputedStyle(el);
```

### A8. elementFromPoint / caret APIs

```
(no hits)
```

### A9. window geometry reads

```
packages/connect-explorer-theme/src/components/sidebar.tsx:69:        if (activeElement && (window.innerWidth > 767 || menu)) {
packages/connect-explorer-theme/src/components/sidebar.tsx:168:                            {mounted && window.innerWidth < 768 && (
packages/env-utils/src/envUtils.ts:36:const getWindowWidth = () => window.innerWidth;
packages/env-utils/src/envUtils.ts:38:const getWindowHeight = () => window.innerHeight;
```

## B. requestAnimationFrame use

### B1. requestAnimationFrame

```
suite/router/src/useAnchor.ts:40:                window.requestAnimationFrame(() => {
packages/components/src/components/ResizableBox/ResizableBox.tsx:347:            rafRef.current = requestAnimationFrame(() => {
packages/product-components/src/components/EditableText/EditableText.tsx:220:        requestAnimationFrame(() => {
packages/product-components/src/components/EditableText/utils.ts:59:            requestAnimationFrame(() => {
packages/product-components/src/components/EditableText/utils.ts:64:        requestAnimationFrame(() => {
packages/analytics-docs/src/App.tsx:64:        rafRef.current = requestAnimationFrame(() => {
packages/analytics-docs/src/App.tsx:163:        requestAnimationFrame(() => {
packages/analytics-docs/src/App.tsx:164:            requestAnimationFrame(tryScroll);
packages/suite/src/hooks/suite/useClearAnchorHighlightOnClick.ts:22:            frameId = requestAnimationFrame(() => {
packages/suite/src/components/suite/asset-picker/components/AssetRow/ExpandableAssetRowTokens/ExpandableAssetRowTokens.tsx:57:                            requestAnimationFrame(() => {
packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/AssetSearchWithNetworkFilter/hooks/useNetworkFilter.ts:64:        requestAnimationFrame(() => {
packages/suite/src/components/suite/FindBar/useFindInPage.ts:53:                requestAnimationFrame(() => {
```

## C. CSS transitions and animations

C0 is the authoritative superset (styled-components declarations wrap across lines, so
targeted single-line regexes under-match); C1–C3 are targeted views into it.
Vendored CSS is out of scope: `packages/blockchain-link/src/ui/spectre.min.css`,
`packages/connect-explorer-theme/css/*` (forked Nextra theme).

### C0. every transition-ish line (superset, needs classification)

```
suite/receive/src/AddressHistoryRow.tsx:44:    transition:
packages/components/src/components/DotIndicator/DotIndicator.tsx:11:    transition:
packages/components/src/components/loaders/LoadingContent/LoadingContent.tsx:15:    transition: opacity 0.25s ease-out;
packages/components/src/components/loaders/LoadingContent/LoadingContent.tsx:20:                  transition-delay: 0s;
packages/components/src/components/loaders/LoadingContent/LoadingContent.tsx:23:                  transition-delay: 2.5s;
packages/components/src/components/loaders/LoadingContent/LoadingContent.tsx:33:    transition: transform 0.25s ease-out;
packages/components/src/components/loaders/LoadingContent/LoadingContent.tsx:39:                  transition-delay: 0s;
packages/components/src/components/loaders/LoadingContent/LoadingContent.tsx:43:                  transition-delay: 2.5s;
packages/components/src/components/loaders/ProgressBar/ProgressBar.tsx:22:    transition: width 0.5s;
packages/components/src/components/loaders/Stepper/Stepper.tsx:16:    transition: background-color 0.2s;
packages/components/src/components/Modal/Modal.tsx:29:    transition: background 0.3s;
packages/components/src/components/Icon/Icon.tsx:75:        transition: fill 0.14s;
suite/discreet-mode/src/HiddenPlaceholder.tsx:26:            transition: all 0.1s ease;
suite/intl/src/messages.ts:11862:            "When you stake, the responsibility for your funds' security transitions from your Trezor to Everstake.",
packages/components/src/components/Menu/Menu.tsx:53:    transition: background 0.3s;
packages/connect/src/device/thp/handshake.ts:63:    // ready for transition to state HH1 -> thpHandshake
packages/connect/src/device/thp/pairing.ts:268:    // if thpState.isPaired then transition to HC0 (credentials) otherwise transition to HP0 (pairing)
packages/components/src/components/Collapsible/CollapsibleContent.tsx:40:                    transition={{
packages/components/src/components/Collapsible/CollapsibleContent.tsx:42:                        ease: motionEasing.transition,
packages/components/src/components/Collapsible/CollapsibleToggleIcon.tsx:13:    transition: transform ${ANIMATION_DURATION}s cubic-bezier(${motionEasing.transition.join(', ')});
packages/components/src/components/Table/TableRow.tsx:28:    transition: background-color 0.2s;
packages/components/src/components/Illustration/Illustration.tsx:36:        transition: fill 0.3s;
packages/components/src/components/Illustration/Illustration.tsx:41:        transition: fill 0.3s;
packages/components/src/components/SubTabs/SubTabsItem.tsx:11:    transition:
packages/suite/src/views/onboarding/steps/SelectBackupType/OptionWithContent.tsx:45:                      transition: background 0.2s ease;
packages/analytics-docs/src/app/layout.tsx:59:    transition: border-color 0.4s ease-out;
packages/components/src/components/buttons/utils.ts:56:    transition: 0.1s ease-in-out;
packages/components/src/components/buttons/TextButton/TextButton.tsx:55:    transition: 0.1s ease-in-out;
packages/components/src/components/Card/Card.tsx:50:    transition: 0.2s ease-in-out;
packages/components/src/components/Box/Box.tsx:56:    transition: 0.2s ease-in-out;
packages/components/src/components/form/Select/customComponents.tsx:39:    transition: transform 0.2s ease-in-out;
packages/components/src/components/form/TopAddons.tsx:9:    transition: opacity 0.1s ease-out;
packages/components/src/components/form/Switch/Switch.tsx:33:    transition:
packages/components/src/components/form/Switch/Switch.tsx:75:    transition: transform 0.25s ease 0s;
packages/components/src/components/form/SelectBar/SelectBar.tsx:48:    transition:
packages/components/src/components/form/SelectBar/SelectBar.tsx:72:    transition: color 0.175s;
packages/components/src/components/form/utils.ts:61:    transition: 0.1s ease-in-out;
packages/components/src/components/form/FloatingLabel.tsx:17:    transition: 120ms ${motionEasingStrings.enter};
packages/components/src/components/form/Radio/Radio.tsx:35:        transition: 0.2s ease-in-out;
packages/components/src/components/form/InputWrapper.tsx:20:    transition:
packages/components/src/components/Tabs/TabsItem.tsx:13:    transition: opacity ${TRANSFORM_OPTIONS};
packages/components/src/components/Tabs/TabsItem.tsx:26:        transition:
packages/components/src/components/Tabs/Tabs.tsx:47:        transition: transform ${TRANSFORM_OPTIONS};
packages/suite/src/views/wallet/tokens/DropdownRow.tsx:13:    transition: transform 0.2s ease-in-out;
packages/components/src/components/CollapsibleBox/CollapsibleBox.tsx:69:    transition: background 0.3s;
packages/components/src/components/CollapsibleBox/CollapsibleBox.tsx:90:    transition: opacity 0.15s;
packages/components/src/config/motion.ts:18:        transition: { duration: 0.24, ease: 'easeInOut' },
packages/components/src/config/motion.ts:24:    transition: [0.65, 0, 0.35, 1],
packages/suite-desktop-core/src/modules/auto-updater.ts:366:        // save current app version so that after app is relaunched we can show info about transition to the new version
packages/connect-explorer/src/components/Method.tsx:203:    transition: opacity 0.3s;
packages/connect-explorer/src/components/ConnectInitForm.tsx:120:    transition:
packages/connect-explorer/src/components/ConnectInitForm.tsx:159:    transition: opacity 0.3s;
packages/suite/src/views/wallet/details/CoinjoinSetup/CoinjoinSetup.tsx:88:                            transition={{ duration: 0.4, ease: motionEasing.transition }}
packages/suite/src/views/wallet/details/CoinjoinSetup/AnonymityLevelSetup.tsx:39:    transition: {
packages/suite/src/views/wallet/details/CoinjoinSetup/AnonymityLevelSetup.tsx:41:        ease: motionEasing.transition,
packages/suite/src/views/dashboard/DashboardPromoBanner/CarouselIndicator.tsx:23:        transition:
suite-common/suite-sync-types/src/relay/reconnectAllRelays.ts:5:     * so reconnecting from Redux state could select the wrong relay URL during transitions.
packages/suite/src/views/dashboard/DashboardFooter.tsx:191:                                transition={{ duration: 0.3 }}
packages/suite/src/views/dashboard/banner-animations.ts:6:    transition: {
packages/suite/src/views/dashboard/banner-animations.ts:8:        ease: motionEasing.transition,
packages/suite/src/views/dashboard/banner-animations.ts:11:            ease: motionEasing.transition,
packages/suite/src/views/dashboard/banner-animations.ts:15:            ease: motionEasing.transition,
packages/connect-explorer-theme/src/components/input.tsx:16:                    'nx-block nx-w-full nx-appearance-none nx-rounded-lg nx-px-3 nx-py-2 nx-transition-colors',
packages/suite/src/views/settings/SettingsCoins/SettingsCoins.tsx:44:    transition: {
packages/suite/src/views/settings/SettingsCoins/SettingsCoins.tsx:45:        ease: motionEasing.transition,
packages/connect-explorer-theme/src/components/back-to-top.tsx:32:                'nx-flex nx-items-center nx-gap-1.5 nx-transition nx-opacity-0',
packages/connect-explorer-theme/src/components/sidebar.tsx:79:                // needs for mobile since menu has transition transform
packages/connect-explorer-theme/src/components/sidebar.tsx:114:                    'motion-reduce:nx-transition-none [transition:background-color_1.5s_ease]',
packages/connect-explorer-theme/src/components/sidebar.tsx:125:                    'nx-transform-gpu nx-transition-all nx-ease-in-out',
packages/connect-explorer-theme/src/components/sidebar.tsx:212:                                className="max-md:nx-hidden nx-h-7 nx-rounded-md nx-transition-colors nx-text-gray-600 dark:nx-text-gray-400 nx-px-2 hover:nx-bg-gray-100 hover:nx-text-gray-900 dark:hover:nx-bg-primary-100/5 dark:hover:nx-text-gray-50"
packages/connect-explorer-theme/src/components/menu.tsx:31:        'nx-flex nx-rounded-xl nx-px-2 nx-py-1.5 nx-text-sm nx-transition-colors [word-break:break-word]',
packages/connect-explorer-theme/src/components/menu.tsx:344:                        'nx-origin-center nx-transition-transform rtl:-nx-rotate-180',
packages/suite/src/views/settings/SettingsConnectedApps/ConnectPermissions.tsx:70:        transition: 200ms ease-in-out;
packages/connect-explorer-theme/src/components/theme-switch.tsx:57:                                'nx-flex nx-w-full nx-px-2 nx-items-center nx-gap-2 nx-text-sm nx-font-medium nx-capitalize nx-transition-colors',
packages/connect-explorer-theme/src/components/breadcrumb.tsx:22:                                'nx-whitespace-nowrap nx-transition-colors',
packages/connect-explorer-theme/src/components/search.tsx:152:            enter="nx-transition-opacity"
packages/connect-explorer-theme/src/components/search.tsx:155:            leave="nx-transition-opacity"
packages/connect-explorer-theme/src/components/search.tsx:166:                    'nx-items-center nx-gap-1 nx-transition-opacity',
packages/connect-explorer-theme/src/components/search.tsx:276:                leave="nx-transition-opacity nx-duration-100"
packages/connect-explorer-theme/src/components/search.tsx:294:                        transition: 'max-height .2s ease', // don't work with tailwindcss
packages/product-components/src/components/EditableText/EditableText.tsx:61:    transition: color 0.2s ease-in-out;
packages/product-components/src/components/EditableText/EditableText.tsx:145:                transition: 0.2s ease-in-out;
packages/connect-explorer-theme/src/components/collapse.tsx:66:            className="nx-transform-gpu nx-overflow-hidden nx-transition-all nx-ease-in-out motion-reduce:nx-transition-none"
packages/connect-explorer-theme/src/components/collapse.tsx:72:                    'nx-transition-opacity nx-duration-500 nx-ease-in-out motion-reduce:nx-transition-none',
packages/product-components/src/components/EditableText/ActionsContainer.tsx:43:            transition: 200ms ease-in-out;
packages/connect-explorer-theme/src/components/nav-links.tsx:18:        'nx-flex nx-max-w-[50%] nx-items-center nx-gap-1 nx-py-4 nx-text-base nx-font-medium nx-text-gray-600 nx-transition-colors [word-break:break-word] hover:nx-text-primary-600 dark:nx-text-gray-300 md:nx-text-lg',
packages/suite/src/views/settings/SettingsGeneral/Experimental.tsx:96:    transition: { duration: 0.24, ease: 'easeInOut' },
packages/suite/src/views/settings/SettingsGeneral/Experimental.tsx:112:    transition: { duration: 0.24, ease: 'easeInOut' },
packages/connect-explorer-theme/src/components/navbar.tsx:62:                    leave="nx-transition-opacity"
packages/connect-explorer-theme/src/components/navbar.tsx:73:                                        'nx-py-1.5 nx-transition-colors ltr:nx-pl-3 ltr:nx-pr-9 rtl:nx-pr-3 rtl:nx-pl-9',
packages/connect-explorer-theme/src/components/navbar.tsx:142:                                        pathClassName="nx-origin-center nx-transition-transform nx-rotate-90"
packages/product-components/src/components/AssetShareIndicator/AssetShareIndicator.tsx:71:        ease: motionEasing.transition,
packages/product-components/src/components/AssetShareIndicator/AssetShareIndicator.tsx:103:                    transition={transition}
packages/connect-explorer-theme/src/mdx-components.tsx:158:                'nx-flex nx-items-center nx-cursor-pointer nx-list-none nx-p-1 nx-transition-colors hover:nx-bg-gray-100 dark:hover:nx-bg-neutral-800',
packages/connect-explorer-theme/src/mdx-components.tsx:159:                "before:nx-mr-1 before:nx-inline-block before:nx-transition-transform before:nx-content-[''] dark:before:nx-invert before:nx-shrink-0",
packages/product-components/src/components/PasswordStrengthIndicator/PasswordStrengthIndicator.tsx:35:    transition: all 0.5s;
packages/suite/src/views/wallet/send/Outputs/Outputs.tsx:22:    transition: height 0.2s ${motionEasingStrings.transition};
packages/suite/src/views/wallet/send/Outputs/Outputs.tsx:81:                            transition={{
packages/suite/src/views/wallet/send/Outputs/Outputs.tsx:83:                                ease: motionEasing.transition,
packages/product-components/src/components/SidebarBanner/SidebarBanner.tsx:63:        transition: {
packages/product-components/src/components/SidebarBanner/SidebarBanner.tsx:73:        transition: {
packages/suite-desktop-ui/src/GlobalStyle.tsx:15:        transition: transform 0.16s ease, background 0.16s ease;
packages/product-components/src/components/ConfirmOnDevice/ConfirmOnDevicePill.tsx:32:                transition={{
packages/product-components/src/components/Settings/OutlineHighlight.tsx:40:        transition: opacity 0.6s ease-in;
packages/product-components/src/components/Settings/OutlineHighlight.tsx:41:        transition-delay: 0.3s;
packages/theme/src/index.ts:14:export { transitions } from './transitions';
packages/theme/src/transitions.ts:1:export const transitions = {
packages/suite/src/support/suite/styles/animations.ts:11:        transition: transform 300ms ease-in-out;
packages/suite/src/support/suite/styles/animations.ts:20:        transition: transform 300ms ease-in-out;
packages/suite/src/support/suite/styles/animations.ts:30:        transition: transform 300ms ease-in-out;
packages/suite/src/support/suite/styles/animations.ts:39:        transition: transform 300ms ease-in-out;
packages/suite/src/support/suite/styles/animations.ts:42:    .step-transition-enter {
packages/suite/src/support/suite/styles/animations.ts:48:    .step-transition-enter-active {
packages/suite/src/support/suite/styles/animations.ts:51:        transition: opacity ${STEP_ANIMATION_DURATION}ms cubic-bezier(1, -0.01, 1, -0.02),
packages/suite/src/support/suite/styles/animations.ts:55:    .step-transition-exit {
packages/suite/src/support/suite/styles/animations.ts:60:    .step-transition-exit-active {
packages/suite/src/support/suite/styles/animations.ts:63:        transition: opacity ${STEP_ANIMATION_DURATION}ms cubic-bezier(0, 1.01, 0, 1),
packages/suite/src/support/suite/styles/animations.ts:73:        transition: opacity 1s;
packages/suite/src/support/suite/styles/animations.ts:83:        transition: opacity 1s;
packages/suite/src/views/wallet/transactions/CoinjoinSummary/CoinjoinStatusWheel/CoinjoinProgressWheel.tsx:79:    transition:
packages/suite/src/views/wallet/transactions/CoinjoinSummary/CoinjoinStatusWheel/CoinjoinProgressContent.tsx:25:    transition:
packages/suite/src/components/suite/AmountUnitSwitchWrapper.tsx:20:    transition: background 0.1s ease-in;
packages/suite/src/components/wallet/TransactionItem/TransactionItemBlurWrapper.tsx:8:            transition: filter 0.3s;
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:169:        transition: transform 0.3s;
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:174:        transition: opacity 0.1s;
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:323:        transition: 0.3s ease;
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:373:        transition: transform 0.2s;
packages/suite/src/components/suite/notifications/Toaster/ToasterProvider.tsx:44:            transition={Slide}
packages/suite/src/components/suite/asset-picker/components/AssetRow/ExpandableAssetRowTokens/ExpandableAssetRowTokens.tsx:21:    transition: opacity 350ms ease-out;
packages/suite/src/components/wallet/Pagination.tsx:34:    transition:
packages/suite/src/components/suite/layouts/SuiteLayout/CoinjoinBars/CoinjoinStatusBar.tsx:24:    transition: transform 0.15s ease-in-out;
packages/suite/src/components/suite/layouts/SuiteLayout/CoinjoinBars/CoinjoinStatusBar.tsx:36:    transition: background 0.15s;
packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountItem/AccountRow/AccountRow.tsx:17:    transition: 0.2s ease-in-out;
packages/suite/src/components/earn/yield/hooks/useYieldFlow.ts:366:    // Sync form value on step transitions driven by Redux (e.g. completeApproval, enterModifyMode from thunk)
packages/suite/src/components/wallet/WalletLayout/AccountsMenu/CoinsFilter.tsx:16:    transition: outline 0.2s;
packages/suite/src/components/wallet/WalletLayout/AccountsMenu/CoinsFilter.tsx:58:        transition: {
packages/suite/src/components/wallet/WalletLayout/AccountsMenu/CoinsFilter.tsx:59:            ease: motionEasing.transition,
packages/suite/src/components/wallet/WalletLayout/AccountsMenu/CoinsFilter.tsx:61:                ease: motionEasing.transition,
packages/suite/src/components/wallet/CoinjoinAccountDiscoveryProgress/RotatingFacts.tsx:72:                transition={{ duration: 0.4, ease: motionEasing.transition }}
packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/AccountName/AccountDetails.tsx:99:            transition: { duration: 0.3, ease: motionEasing.enter },
packages/suite/src/components/suite/layouts/SuiteLayout/DeviceSelector/DeviceSelector.tsx:25:    transition: background 0.15s;
packages/suite/src/components/suite/layouts/SuiteLayout/Sidebar/NavigationItem.tsx:32:    transition: 0.2s ease-in-out;
packages/suite/src/components/suite/StakeAmountWrapper.tsx:20:    transition: background 0.1s ease-in;
packages/suite/src/components/suite/PrerequisitesGuide/PrerequisitesGuide.tsx:26:        transition={{ delay: 0.2, duration: 0.4, ease: motionEasing.enter }}
packages/suite/src/components/suite/PrerequisitesGuide/PrerequisitesGuide.tsx:37:        transition={{ delay: 0.6, duration: 0.5, ease: motionEasing.enter }}
packages/suite/src/components/settings/SettingsLayout.tsx:102:                        transition={{ duration: 0.3, ease: motionEasing.transition }}
packages/suite/src/components/firmware/RotatingPhrases.tsx:55:                        transition={{ duration: 0.3, ease: motionEasing.enter }}
packages/suite/src/components/guide/GuideRouter.tsx:60:    // if guide is open, do not animate guide opening if transitioning between onboarding, welcome and suite layout
packages/suite/src/components/guide/GuideRouter.tsx:83:                transition: {
packages/suite/src/components/guide/GuideRouter.tsx:90:                transition: {
packages/suite/src/components/guide/GuideImage.tsx:17:    transition: all 0.2s ease;
packages/suite/src/components/guide/GuideButton.tsx:34:    transition: ${({ $isGuideOpen }) => ($isGuideOpen ? 'none' : 'all 0.3s ease 0.3s')};
packages/suite/src/components/guide/GuideButton.tsx:51:    transition: 0.1s ease-in-out;
packages/suite/src/components/connection/ConnectDeviceGlobalModal.tsx:163:                                    transition={{
packages/suite/src/components/suite/modals/ReduxModal/DeviceContextModal/PassphraseInputCard.tsx:52:    transition: { duration: 0.2, ease: motionEasing.transition },
packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/ActivateAssetsModal.tsx:26:    transition: {
packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/ActivateAssetsModal.tsx:28:        ease: motionEasing.transition,
packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/ActivateAssetsModal.tsx:31:            ease: motionEasing.transition,
packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/ActivateAssetsModal.tsx:35:            ease: motionEasing.transition,
```

### C1. transition: all / bare-duration shorthand

```
suite/discreet-mode/src/HiddenPlaceholder.tsx:26:            transition: all 0.1s ease;
packages/components/src/components/buttons/utils.ts:56:    transition: 0.1s ease-in-out;
packages/components/src/components/buttons/TextButton/TextButton.tsx:55:    transition: 0.1s ease-in-out;
packages/components/src/components/Card/Card.tsx:50:    transition: 0.2s ease-in-out;
packages/components/src/components/Box/Box.tsx:56:    transition: 0.2s ease-in-out;
packages/components/src/components/form/utils.ts:61:    transition: 0.1s ease-in-out;
packages/components/src/components/form/FloatingLabel.tsx:17:    transition: 120ms ${motionEasingStrings.enter};
packages/components/src/components/form/Radio/Radio.tsx:35:        transition: 0.2s ease-in-out;
packages/product-components/src/components/EditableText/EditableText.tsx:145:                transition: 0.2s ease-in-out;
packages/product-components/src/components/EditableText/ActionsContainer.tsx:43:            transition: 200ms ease-in-out;
packages/product-components/src/components/PasswordStrengthIndicator/PasswordStrengthIndicator.tsx:35:    transition: all 0.5s;
packages/suite/src/views/settings/SettingsConnectedApps/ConnectPermissions.tsx:70:        transition: 200ms ease-in-out;
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:323:        transition: 0.3s ease;
packages/suite/src/components/wallet/WalletLayout/AccountsMenu/AccountItem/AccountRow/AccountRow.tsx:17:    transition: 0.2s ease-in-out;
packages/suite/src/components/suite/layouts/SuiteLayout/Sidebar/NavigationItem.tsx:32:    transition: 0.2s ease-in-out;
packages/suite/src/components/guide/GuideImage.tsx:17:    transition: all 0.2s ease;
packages/suite/src/components/guide/GuideButton.tsx:51:    transition: 0.1s ease-in-out;
```

### C2. transition-property: all

```
(no hits)
```

### C3. transitions naming layout properties

```
packages/components/src/components/loaders/ProgressBar/ProgressBar.tsx:22:    transition: width 0.5s;
packages/suite/src/views/wallet/send/Outputs/Outputs.tsx:22:    transition: height 0.2s ${motionEasingStrings.transition};
packages/connect-explorer-theme/src/components/search.tsx:294:                        transition: 'max-height .2s ease', // don't work with tailwindcss
```

### C4. keyframes declarations

```
packages/components/src/components/Badge/Badge.tsx:3:import styled, { css, keyframes } from 'styled-components';
packages/components/src/components/Skeleton/Skeleton.tsx:1:import styled, { css, keyframes } from 'styled-components';
packages/components/src/config/animations.ts:1:import { keyframes } from 'styled-components';
packages/components/src/components/Dot/Dot.tsx:1:import styled, { css, keyframes } from 'styled-components';
packages/components/src/components/Menu/Menu.tsx:3:import styled, { keyframes } from 'styled-components';
packages/components/src/components/form/BottomText.tsx:3:import styled, { keyframes } from 'styled-components';
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:348:    @keyframes Toastify__trackProgress {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:415:    @keyframes Toastify__bounceInRight {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:442:    @keyframes Toastify__bounceOutRight {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:453:    @keyframes Toastify__bounceInLeft {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:480:    @keyframes Toastify__bounceOutLeft {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:491:    @keyframes Toastify__bounceInUp {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:518:    @keyframes Toastify__bounceOutUp {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:533:    @keyframes Toastify__bounceInDown {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:560:    @keyframes Toastify__bounceOutDown {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:611:    @keyframes Toastify__zoomIn {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:621:    @keyframes Toastify__zoomOut {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:642:    @keyframes Toastify__flipIn {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:664:    @keyframes Toastify__flipOut {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:686:    @keyframes Toastify__slideInRight {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:696:    @keyframes Toastify__slideInLeft {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:706:    @keyframes Toastify__slideInUp {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:716:    @keyframes Toastify__slideInDown {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:726:    @keyframes Toastify__slideOutRight {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:736:    @keyframes Toastify__slideOutLeft {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:746:    @keyframes Toastify__slideOutDown {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:756:    @keyframes Toastify__slideOutUp {
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:810:    @keyframes Toastify__spin {
packages/suite/src/views/wallet/transactions/CoinjoinSummary/CoinjoinStatusWheel/CoinjoinProgressWheel.tsx:4:import styled, { type DefaultTheme, css, keyframes } from 'styled-components';
```

### C5. animation shorthand lines

```
packages/components/src/components/Badge/Badge.tsx:74:                animation: ${badgeRing} ${RING_DURATION}ms ${EASE_OUT} ${RING_DELAY}ms
packages/components/src/components/Badge/Badge.tsx:79:                animation: none;
packages/suite/src/views/wallet/send/SendHeader.tsx:25:    animation: ${FADE_IN} 0.16s;
packages/components/src/components/Skeleton/Skeleton.tsx:30:    animation: ${SHINE} 1.5s ease infinite;
packages/components/src/components/Dot/Dot.tsx:50:                animation: ${ringExpand} ${PULSE_DURATION}ms ${ENTRANCE_EASE} ${PULSE_ITERATIONS};
packages/components/src/components/Dot/Dot.tsx:54:                animation: none;
packages/components/src/components/Timerange/Timerange.tsx:429:    animation: ${DROPDOWN_MENU} 0.15s ease-in-out;
packages/components/src/components/Menu/Menu.tsx:48:    animation: ${DROPDOWN_MENU} 0.15s ease-in-out;
packages/components/src/components/form/BottomText.tsx:21:    animation: ${slideDown} 0.18s ease-in-out forwards;
packages/suite/src/views/wallet/transactions/CoinjoinSummary/CoinjoinStatusWheel/CoinjoinProgressWheel.tsx:54:    animation: ${DELAYED_SPIN} 2.3s cubic-bezier(0.34, 0.45, 0.17, 0.87) infinite;
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:369:        animation: Toastify__trackProgress linear 1 forwards;
packages/suite/src/components/suite/notifications/Toaster/ReactToastifyStyles.tsx:412:        animation: Toastify__spin 0.65s linear infinite;
packages/suite/src/components/suite/BundleLoader.tsx:13:    animation: ${FADE_IN} 0.2s 0.5s;
```

## D. Scroll/resize listeners and observers (context for A)

### D1. scroll/resize event listeners

```
packages/connect-explorer-theme/src/components/back-to-top.tsx:19:        window.addEventListener('scroll', toggleVisible);
packages/connect-explorer-theme/src/polyfill.ts:14:    window.addEventListener('resize', addResizingClass);
packages/components/src/components/VirtualizedList/VirtualizedList.tsx:208:            container.addEventListener('scroll', handleScroll, { passive: true });
packages/suite/src/components/suite/layouts/SuiteLayout/Sidebar/Sidebar.tsx:127:        window.addEventListener('resize', onResize);
```

### D2. existing observers (ground truth, mostly good)

```
suite/router/src/useAnchor.ts:25:        const observer = new IntersectionObserver(
packages/suite-web/src/index.ts:7:const observer = new MutationObserver(() => {
packages/components/src/components/Tabs/Tabs.tsx:98:        const observer = new ResizeObserver(() => {
packages/suite-web/src/static/vite-index.ts:5:const observer = new MutationObserver(() => {
packages/components/src/utils/useScrollShadow.tsx:88:        const observer = new ResizeObserver(() => {
packages/product-components/src/components/EditableText/utils.ts:58:        const resizeObserver = new ResizeObserver(() => {
packages/connect-explorer-theme/src/contexts/active-anchor.tsx:35:        observerRef.current = new IntersectionObserver(
packages/components/src/components/typography/TruncateWithTooltip/TruncateWithTooltip.tsx:26:        const resizeObserver = new ResizeObserver(entries => {
packages/suite/src/components/suite/FindBar/useFindInPage.ts:224:        const obs = new MutationObserver(muts => {
packages/suite/src/components/suite/layouts/SuiteLayout/useResponsiveContextOnChange.tsx:17:        const resizeObserver = new ResizeObserver(entries => {
packages/suite/src/views/wallet/send/Outputs/Outputs.tsx:47:        const observer = new ResizeObserver(([entry]) => {
packages/suite/src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/AccountName/AccountName.tsx:37:        const observer = new IntersectionObserver(
packages/suite/src/views/wallet/staking/components/StakingDashboard/components/ProgressLabels/ProgressLabel.tsx:126:        const resizeObserver = new ResizeObserver(() => {
```
