import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { SettingsLayout } from '@settings-components';
import { Translation } from '@suite-components';
import {
    ActionButton,
    ActionColumn,
    ActionInput,
    ActionSelect,
    Analytics,
    Theme,
    Section,
    SectionItem,
    TextColumn,
} from '@suite-components/Settings';
import { FIAT, LANGUAGES } from '@suite-config';
import { useAnalytics, useDevice, useSelector, useActions } from '@suite-hooks';
import { Button, Tooltip, Switch } from '@trezor/components';
import { capitalizeFirstLetter } from '@suite-utils/string';

import * as suiteActions from '@suite-actions/suiteActions';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import * as storageActions from '@suite-actions/storageActions';
import * as languageActions from '@settings-actions/languageActions';
import * as routerActions from '@suite-actions/routerActions';
import * as metadataActions from '@suite-actions/metadataActions';
import * as desktopUpdateActions from '@suite-actions/desktopUpdateActions';

import { getReleaseUrl } from '@suite/services/github';
import { isDesktop, isWeb } from '@suite-utils/env';

const buildCurrencyOption = (currency: string) => ({
    value: currency,
    label: currency.toUpperCase(),
});

const Version = styled.div`
    span {
        display: flex;
        align-items: center;
    }
`;

const VersionButton = styled(Button)`
    padding-left: 1ch;
`;

const VersionTooltip = styled(Tooltip)`
    display: inline-flex;
    margin: 0 2px;
`;

const VersionLink = styled.a``;

const Settings = () => {
    const analytics = useAnalytics();

    const { isLocked, device } = useDevice();
    const isDeviceLocked = isLocked();

    const { language, localCurrency, metadata, desktopUpdate, tor, torOnionLinks } = useSelector(
        state => ({
            language: state.suite.settings.language,
            localCurrency: state.wallet.settings.localCurrency,
            metadata: state.metadata,
            desktopUpdate: state.desktopUpdate,
            tor: state.suite.tor,
            torOnionLinks: state.suite.settings.torOnionLinks,
        }),
    );
    const {
        setLocalCurrency,
        removeDatabase,
        fetchLocale,
        goto,
        initMetadata,
        disableMetadata,
        disconnectProvider,
        setOnionLinks,
        setUpdateWindow,
    } = useActions({
        setLocalCurrency: walletSettingsActions.setLocalCurrency,
        removeDatabase: storageActions.removeDatabase,
        fetchLocale: languageActions.fetchLocale,
        goto: routerActions.goto,
        initMetadata: metadataActions.init,
        disableMetadata: metadataActions.disableMetadata,
        disconnectProvider: metadataActions.disconnectProvider,
        setOnionLinks: suiteActions.setOnionLinks,
        setUpdateWindow: desktopUpdateActions.setUpdateWindow,
    });

    // Tor
    const [torAddress, setTorAddress] = useState('');
    useEffect(() => {
        window.desktopApi?.getTorAddress().then(address => setTorAddress(address));
    }, [setTorAddress]);

    const saveTorAddress = useCallback(() => {
        // TODO: Validation
        window.desktopApi!.setTorAddress(torAddress);
    }, [torAddress]);

    // Auto Updater
    const checkForUpdates = useCallback(() => window.desktopApi?.checkForUpdates(true), []);
    const installRestart = useCallback(() => window.desktopApi?.installUpdate(), []);
    const maximizeUpdater = useCallback(() => setUpdateWindow('maximized'), [setUpdateWindow]);

    return (
        <SettingsLayout data-test="@settings/index">
            <Section title={<Translation id="TR_LOCALIZATION" />}>
                <SectionItem data-test="@settings/language">
                    <TextColumn title={<Translation id="TR_LANGUAGE" />} />
                    <ActionColumn>
                        <ActionSelect
                            hideTextCursor
                            useKeyPressScroll
                            noTopLabel
                            value={{
                                value: language,
                                label: LANGUAGES.find(l => l.code === language)!.name,
                            }}
                            isDisabled
                            options={LANGUAGES.map(l => ({ value: l.code, label: l.name }))}
                            onChange={(option: {
                                value: typeof LANGUAGES[number]['code'];
                                label: typeof LANGUAGES[number]['name'];
                            }) => {
                                fetchLocale(option.value);
                                analytics.report({
                                    type: 'settings/general/change-language',
                                    payload: {
                                        language: option.value,
                                    },
                                });
                            }}
                            data-test="@settings/language-select"
                        />
                    </ActionColumn>
                </SectionItem>

                <SectionItem data-test="@settings/fiat">
                    <TextColumn title={<Translation id="TR_PRIMARY_FIAT" />} />
                    <ActionColumn>
                        <ActionSelect
                            noTopLabel
                            hideTextCursor
                            useKeyPressScroll
                            onChange={(option: { value: string; label: string }) => {
                                setLocalCurrency(option.value);
                                analytics.report({
                                    type: 'settings/general/change-fiat',
                                    payload: {
                                        fiat: option.value,
                                    },
                                });
                            }}
                            value={buildCurrencyOption(localCurrency)}
                            options={FIAT.currencies.map(c => buildCurrencyOption(c))}
                            data-test="@settings/fiat-select"
                        />
                    </ActionColumn>
                </SectionItem>
            </Section>

            <Section title={<Translation id="TR_LABELING" />}>
                <SectionItem data-test="@settings/metadata">
                    <TextColumn
                        title={<Translation id="TR_LABELING_ENABLED" />}
                        description={<Translation id="TR_LABELING_FEATURE_ALLOWS" />}
                    />
                    <ActionColumn>
                        <Switch
                            // hmm maybe it should never be disabled, as it is not device related option (although it triggers device flow?)
                            // but on the other hand there still may be case when it remembered device is disconnected and its metadata.status
                            // is cancelled or disabled. In such case, initMetadata does not make any sense as it needs device connected.
                            // You could say: "ok, whatever, but this switch is changing only application setting, why messing with device?"
                            // Yes, you are right, but if it was done this way, you would enable metadata, then go to wallet, discovery
                            // and maybe device authorization would be triggered and only after that you would get metadata flow started, wouldn't
                            // that be confusing? I believe it is better to do it right away, but need for disabling this switch in specific
                            // edge case is a drawback.
                            isDisabled={!metadata.enabled && !device?.connected && isDeviceLocked}
                            data-test="@settings/metadata-switch"
                            checked={metadata.enabled}
                            onChange={() =>
                                metadata.enabled ? disableMetadata() : initMetadata(true)
                            }
                        />
                    </ActionColumn>
                </SectionItem>
                {metadata.enabled && metadata.provider && (
                    <SectionItem data-test="@settings/metadata-provider">
                        <TextColumn
                            title={
                                metadata.provider.isCloud ? (
                                    <Translation
                                        id="TR_CONNECTED_TO_PROVIDER"
                                        values={{
                                            provider: capitalizeFirstLetter(metadata.provider.type),
                                            user: metadata.provider.user,
                                        }}
                                    />
                                ) : (
                                    <Translation id="TR_CONNECTED_TO_PROVIDER_LOCALLY" />
                                )
                            }
                            description={
                                metadata.provider.isCloud ? (
                                    <Translation id="TR_YOUR_LABELING_IS_SYNCED" />
                                ) : (
                                    <Translation id="TR_YOUR_LABELING_IS_SYNCED_LOCALLY" />
                                )
                            }
                        />
                        <ActionColumn>
                            <ActionButton
                                variant="secondary"
                                onClick={() => disconnectProvider()}
                                data-test="@settings/metadata/disconnect-provider-button"
                            >
                                <Translation id="TR_DISCONNECT" />
                            </ActionButton>
                        </ActionColumn>
                    </SectionItem>
                )}
                {metadata.enabled && !metadata.provider && device?.metadata.status === 'enabled' && (
                    <SectionItem>
                        <TextColumn
                            title={<Translation id="TR_LABELING_NOT_SYNCED" />}
                            description={<Translation id="TR_TO_MAKE_YOUR_LABELS_PERSISTENT" />}
                        />
                        <ActionColumn>
                            <ActionButton
                                variant="secondary"
                                onClick={() => initMetadata(true)}
                                data-test="@settings/metadata/connect-provider-button"
                            >
                                <Translation id="TR_CONNECT" />
                            </ActionButton>
                        </ActionColumn>
                    </SectionItem>
                )}
            </Section>

            {(isDesktop() || (isWeb() && tor)) && (
                <Section title={<Translation id="TR_TOR" />}>
                    {isDesktop() && (
                        <>
                            <SectionItem>
                                <TextColumn
                                    title={<Translation id="TR_TOR_TITLE" />}
                                    description={
                                        <Translation
                                            id="TR_TOR_DESCRIPTION"
                                            values={{
                                                lineBreak: <br />,
                                            }}
                                        />
                                    }
                                    learnMore="https://www.torproject.org/"
                                />
                                <ActionColumn>
                                    <Switch
                                        data-test="@settings/general/tor-switch"
                                        checked={tor}
                                        onChange={() => {
                                            analytics.report({
                                                type: 'menu/toggle-tor',
                                                payload: {
                                                    value: !tor,
                                                },
                                            });
                                            window.desktopApi!.toggleTor(!tor);
                                        }}
                                    />
                                </ActionColumn>
                            </SectionItem>
                            <SectionItem>
                                <TextColumn
                                    title={<Translation id="TR_TOR_PARAM_TITLE" />}
                                    description={<Translation id="TR_TOR_PARAM_DESCRIPTION" />}
                                />
                                <ActionColumn>
                                    <ActionInput
                                        noTopLabel
                                        noError
                                        value={torAddress}
                                        state={/* (TODO: Error check) ? 'error' : */ undefined}
                                        onChange={(event: React.FormEvent<HTMLInputElement>) =>
                                            setTorAddress(event.currentTarget.value)
                                        }
                                        onBlur={saveTorAddress}
                                        data-test="@settings/general/tor-address"
                                        placeholder="127.0.0.1:9050"
                                    />
                                </ActionColumn>
                            </SectionItem>
                        </>
                    )}
                    <SectionItem>
                        <TextColumn
                            title={<Translation id="TR_ONION_LINKS_TITLE" />}
                            description={<Translation id="TR_ONION_LINKS_DESCRIPTION" />}
                        />
                        <ActionColumn>
                            <Switch
                                data-test="@settings/general/onion-links-switch"
                                checked={torOnionLinks}
                                onChange={() => {
                                    analytics.report({
                                        type: 'menu/toggle-onion-links',
                                        payload: {
                                            value: !torOnionLinks,
                                        },
                                    });
                                    setOnionLinks(!torOnionLinks);
                                }}
                            />
                        </ActionColumn>
                    </SectionItem>
                </Section>
            )}

            <Section title={<Translation id="TR_APPLICATION" />}>
                <Theme />
                <Analytics />

                <SectionItem data-test="@settings/storage">
                    <TextColumn
                        title={<Translation id="TR_SUITE_STORAGE" />}
                        description={<Translation id="TR_CLEAR_STORAGE_DESCRIPTION" />}
                    />
                    <ActionColumn>
                        <ActionButton
                            onClick={async () => {
                                removeDatabase();
                                if (window.desktopApi) {
                                    // relaunch desktop app
                                    window.desktopApi.send('app/restart');
                                } else {
                                    // redirect to / and reload the web
                                    await goto('suite-index');
                                    window.location.reload();
                                }
                            }}
                            variant="secondary"
                        >
                            <Translation id="TR_CLEAR_STORAGE" />
                        </ActionButton>
                    </ActionColumn>
                </SectionItem>
                <SectionItem data-test="@settings/version">
                    <TextColumn
                        title={<Translation id="TR_SUITE_VERSION" />}
                        description={
                            <Version>
                                <Translation
                                    id="TR_YOUR_CURRENT_VERSION"
                                    values={{
                                        version: (
                                            <VersionTooltip content={process.env.COMMITHASH || ''}>
                                                <VersionLink
                                                    target="_blank"
                                                    href={`https://github.com/trezor/trezor-suite/commit/${process.env.COMMITHASH}`}
                                                >
                                                    <VersionButton
                                                        variant="tertiary"
                                                        icon="EXTERNAL_LINK"
                                                        alignIcon="right"
                                                    >
                                                        {process.env.VERSION}
                                                    </VersionButton>
                                                </VersionLink>
                                            </VersionTooltip>
                                        ),
                                    }}
                                />
                                {!['checking', 'not-available'].includes(desktopUpdate.state) &&
                                    desktopUpdate.latest && (
                                        <>
                                            &nbsp;
                                            <Translation
                                                id="TR_YOUR_NEW_VERSION"
                                                values={{
                                                    version: (
                                                        <VersionLink
                                                            target="_blank"
                                                            href={getReleaseUrl(
                                                                desktopUpdate.latest.version,
                                                            )}
                                                        >
                                                            <VersionButton
                                                                variant="tertiary"
                                                                icon="EXTERNAL_LINK"
                                                                alignIcon="right"
                                                            >
                                                                {desktopUpdate.latest.version}
                                                            </VersionButton>
                                                        </VersionLink>
                                                    ),
                                                }}
                                            />
                                        </>
                                    )}
                            </Version>
                        }
                    />
                    {desktopUpdate.enabled && (
                        <ActionColumn>
                            {desktopUpdate.state === 'checking' && (
                                <ActionButton isDisabled variant="secondary">
                                    <Translation id="SETTINGS_UPDATE_CHECKING" />
                                </ActionButton>
                            )}
                            {desktopUpdate.state === 'not-available' && (
                                <ActionButton onClick={checkForUpdates} variant="secondary">
                                    <Translation id="SETTINGS_UPDATE_CHECK" />
                                </ActionButton>
                            )}
                            {desktopUpdate.state === 'available' && (
                                <ActionButton onClick={maximizeUpdater} variant="secondary">
                                    <Translation id="SETTINGS_UPDATE_AVAILABLE" />
                                </ActionButton>
                            )}
                            {desktopUpdate.state === 'downloading' && (
                                <ActionButton onClick={maximizeUpdater} variant="secondary">
                                    <Translation id="SETTINGS_UPDATE_DOWNLOADING" />
                                </ActionButton>
                            )}
                            {desktopUpdate.state === 'ready' && (
                                <ActionButton onClick={installRestart} variant="secondary">
                                    <Translation id="SETTINGS_UPDATE_READY" />
                                </ActionButton>
                            )}
                        </ActionColumn>
                    )}
                </SectionItem>
            </Section>
        </SettingsLayout>
    );
};

export default Settings;
