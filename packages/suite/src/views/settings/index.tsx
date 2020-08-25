import { SettingsLayout } from '@settings-components';
import { Translation } from '@suite-components';
import {
    ActionButton,
    ActionColumn,
    ActionSelect,
    Analytics,
    Section,
    SectionItem,
    TextColumn,
} from '@suite-components/Settings';
import { FIAT, LANGUAGES } from '@suite-config';
import { useAnalytics } from '@suite-hooks';
import { Button, Tooltip, Switch } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';

import { Props } from './Container';

const buildCurrencyOption = (currency: string) => ({
    value: currency,
    label: currency.toUpperCase(),
});

const Version = styled.div`
    display: flex;
    align-items: center;
`;

const VersionButton = styled(Button)`
    padding-left: 1ch;
`;

const VersionLink = styled.a``;

const Settings = ({
    language,
    metadata,
    device,
    setLocalCurrency,
    localCurrency,
    fetchLocale,
    clearStores,
    goto,
    initMetadata,
    disconnectProvider,
    disableMetadata,
}: Props) => {
    const analytics = useAnalytics();

    return (
        <SettingsLayout data-test="@settings/index">
            <Section title={<Translation id="TR_LOCALIZATION" />}>
                <SectionItem>
                    <TextColumn title={<Translation id="TR_LANGUAGE" />} />
                    <ActionColumn>
                        <ActionSelect
                            variant="small"
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
                        />
                    </ActionColumn>
                </SectionItem>

                <SectionItem>
                    <TextColumn title={<Translation id="TR_PRIMARY_FIAT" />} />
                    <ActionColumn>
                        <ActionSelect
                            noTopLabel
                            variant="small"
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
                <SectionItem>
                    <TextColumn
                        title="Labeling enabled"
                        description="Labeling feature allows you to label your wallets, accounts and transactions. Your labels are made persistent by syncing with cloud provider (Google or Dropbox)."
                    />
                    <ActionColumn>
                        <Switch
                            data-test="@settings/metadata-switch"
                            checked={metadata.enabled}
                            onChange={() =>
                                metadata.enabled ? disableMetadata() : initMetadata(true)
                            }
                        />
                    </ActionColumn>
                </SectionItem>
                {metadata.enabled && metadata.provider && (
                    <SectionItem>
                        <TextColumn
                            title={`Connected to ${metadata.provider.type} as ${metadata.provider.user}`}
                            description="Your labeling is synced with cloud storage provider. Your data are safe, only your Trezor can decrypt them."
                        />
                        <ActionColumn>
                            <ActionButton
                                variant="secondary"
                                onClick={() => disconnectProvider()}
                                data-test="@settings/metadata/disconnect-provider-button"
                            >
                                Disconnect
                            </ActionButton>
                        </ActionColumn>
                    </SectionItem>
                )}
                {metadata.enabled && !metadata.provider && device?.state && (
                    <SectionItem>
                        <TextColumn
                            title="Labeling not persistent"
                            description="To make your labels persistent and available on different devices connect to cloud storage provider. Either Google drive or Dropbox are available."
                        />
                        <ActionColumn>
                            <ActionButton
                                variant="secondary"
                                onClick={() => initMetadata(true)}
                                data-test="@settings/metadata/connect-provider-button"
                            >
                                Connect
                            </ActionButton>
                        </ActionColumn>
                    </SectionItem>
                )}
            </Section>

            <Section title={<Translation id="TR_APPLICATION" />}>
                <Analytics />

                <SectionItem>
                    <TextColumn
                        title={<Translation id="TR_SUITE_STORAGE" />}
                        description={<Translation id="TR_CLEAR_STORAGE_DESCRIPTION" />}
                    />
                    <ActionColumn>
                        <ActionButton
                            onClick={async () => {
                                clearStores();
                                // @ts-ignore global.ipcRenderer is declared in @desktop/preloader.js
                                const { ipcRenderer } = global;
                                if (ipcRenderer) {
                                    // relaunch desktop app
                                    ipcRenderer.send('restart-app');
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
                <SectionItem>
                    <TextColumn
                        title={<Translation id="TR_SUITE_VERSION" />}
                        description={
                            <Version>
                                <Translation id="TR_YOUR_CURRENT_VERSION" />
                                <Tooltip content={process.env.COMMITHASH || ''}>
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
                                </Tooltip>
                            </Version>
                        }
                    />
                    <ActionColumn>
                        {/* todo: Button hidden as it does nothing. But still keep info with version here */}
                        {/* <ActionButton
                                onClick={() => console.log('moo')}
                                isDisabled={uiLocked}
                                variant="secondary"
                            >
                                <Translation id="TR_CHECK_FOR_UPDATES" />
                            </ActionButton> */}
                    </ActionColumn>
                </SectionItem>
            </Section>
        </SettingsLayout>
    );
};

export default Settings;
