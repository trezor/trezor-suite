# Desktop screenshot visual quality review

All **13 desktop PNGs** were inspected through three temporary contact sheets. MCP settings, Electrum URL form, update preferences and Early Access confirmation were also viewed at original size. Every assigned feature entry is visible; no association corrections were required. The separate [errata file](../parts/runtime-desktop-qc-errata.json) is intentionally empty.

The [structured report](./screenshot-quality-desktop.json) records hashes, dimensions, capture conditions and a scope note for every image. Screenshots and the main manifest were not edited; no browser, app, device or service action was performed.

## Privacy and runtime conditions

No sensitive image was identified. The MCP checkbox is off and no configuration/token panel is visible. Electrum shows an empty URL field with an example-format placeholder. No wallet, account, device identifier, seed, PIN or passphrase appears. Preference thresholds are settings, not account amounts.

The captures use an isolated current-source Linux Electron 44.9.3 production bundle in offline mode without a connected wallet/device. The last two captures explicitly use the existing `--enable-updater` QA launch flag to expose controls in the non-codesigned bundle. They show preference and confirmation UI only: no availability check, download, installation or Early Access enrollment is established.

## Per-image scope

- **desktop-analytics-consent** — Consent explanation, enabled anonymous-data toggle and Confirm visible. This is an onboarding preference screen, not proof of any telemetry transmission.
- **desktop-disconnected-home** — Connection prompt and Connect action visible; no USB enumeration, unlock or device session was completed.
- **desktop-privacy-settings** — Auto-eject and Tor toggles/explanation visible and off. No wallet eject or Tor routing was exercised.
- **desktop-analytics-setting** — Analytics preference and explanation visible and off. Does not establish telemetry policy implementation or actual outbound traffic.
- **desktop-maintenance-controls** — Show log, Reset app and current-version display are visible. Neither log content nor reset execution is shown.
- **desktop-security-controls** — MEV and dust switches, threshold input and disabled Save visible. Threshold is a preference, not an account amount. No protected transaction or threshold persistence was exercised.
- **desktop-background-integration** — Auto-start and tray-icon switches visible and off. No OS startup registration or tray behavior was tested.
- **desktop-experimental-tor-external** — External Tor preference is unchecked, with daemon-port explanation; Experimental is enabled above, although its title is clipped at the sticky header. No Tor daemon or network routing was tested.
- **desktop-mcp-server-preference** — MCP preference is unchecked and explanatory text is visible. No server config, authentication token, URL with credentials or secret appears in this capture. No MCP request was performed.
- **desktop-bitcoin-backend-types** — Default, Blockbook and Electrum backend-type choices visible. No URL entry, saved configuration or backend connectivity is established.
- **desktop-electrum-url-form** — Empty editable Electrum URL field and example-format placeholder are clearly visible; Add new is disabled for the empty value. Explorer and Connection Info are collapsed entries. Confirm/Cancel visible. No endpoint was entered, committed or contacted.
- **desktop-update-preferences** — Automatic-update switch, version and Check for updates visible. The existing --enable-updater QA flag exposes the non-codesigned bundle controls. Offline conditions mean no version check, availability result, download or install is established.
- **desktop-early-access-confirmation** — Early Access explanation, unchecked acknowledgement, disabled Opt in and Cancel visible. Reached with the updater QA flag while offline; no enrollment, feed switch or download is established.

## Source cross-checks

- [packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/AdvancedCoinSettingsModal/BackendUrls/BackendUrls.tsx](../../../../packages/suite/src/components/suite/modals/ReduxModal/UserContextModal/AdvancedCoinSettingsModal/BackendUrls/BackendUrls.tsx#L86).
- [suite-app/desktop-app-main/src/modules/auto-updater.ts](../../../../suite-app/desktop-app-main/src/modules/auto-updater.ts#L32).
- [packages/suite/src/views/settings/SettingsGeneral/McpServer.tsx](../../../../packages/suite/src/views/settings/SettingsGeneral/McpServer.tsx#L49).
- [packages/suite/src/views/settings/SettingsGeneral/AutomaticUpdate.tsx](../../../../packages/suite/src/views/settings/SettingsGeneral/AutomaticUpdate.tsx#L47).
- [packages/suite/src/views/settings/SettingsGeneral/EarlyAccess.tsx](../../../../packages/suite/src/views/settings/SettingsGeneral/EarlyAccess.tsx#L48).

The Electrum field exists and is editable; Add new is correctly disabled while empty or invalid according to the source condition. The collapsed Explorer/Connection Info entries do not show their full contents in this capture. Auto-start/tray toggles and Tor/MCP switches establish available preferences, not successful OS integration or running services.

Verification: all thirteen retained PNG hashes, known feature/observation IDs, source locations and documentation links checked; scoped Prettier formatting checked.
