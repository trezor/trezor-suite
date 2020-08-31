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
    removeDatabase,
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
                        title={<Translation id="TR_LABELING_ENABLED" />}
                        description={<Translation id="TR_LABELING_FEATURE_ALLOWS" />}
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
                            title={
                                <Translation
                                    id="TR_CONNECTED_TO_PROVIDER"
                                    values={{
                                        provider: metadata.provider.type,
                                        user: metadata.provider.user,
                                    }}
                                />
                            }
                            description={<Translation id="TR_YOUR_LABELING_IS_SYNCED" />}
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
                {metadata.enabled && !metadata.provider && device?.state && (
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
                                removeDatabase();
                                if (window.desktop_api) {
                                    // relaunch desktop app
                                    window.desktop_api.send('restart-app');
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
