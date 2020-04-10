import { SettingsLayout } from '@settings-components';
import { SUITE } from '@suite-actions/constants';
import { H2 } from '@trezor/components';
import { Translation } from '@suite-components';
import {
    ActionButton,
    ActionColumn,
    ActionSelect,
    Analytics,
    SectionItem,
    Section,
    TextColumn,
} from '@suite-components/Settings';
import { FIAT, LANGUAGES } from '@suite-config';
import React from 'react';
import styled from 'styled-components';

import { Props } from './Container';

const buildCurrencyOption = (currency: string) => {
    return {
        value: currency,
        label: currency.toUpperCase(),
    };
};

const BottomContainer = styled.div`
    margin-top: auto;
`;

export default ({
    locks,
    wallet,
    language,
    setLocalCurrency,
    fetchLocale,
    clearStores,
    goto,
}: Props) => {
    const uiLocked = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);

    return (
        <SettingsLayout>
            <H2>
                <Translation id="TR_GENERAL" />
            </H2>
            <Section title={<Translation id="TR_LANGUAGE" />}>
                <SectionItem>
                    <TextColumn title={<Translation id="TR_LANGUAGE" />} />
                    <ActionColumn>
                        <ActionSelect
                            variant="small"
                            value={{
                                value: language,
                                // sorry for ! but dont know how to force typescript to stay calm
                                label: LANGUAGES.find(l => l.code === language)!.name,
                            }}
                            isDisabled
                            options={LANGUAGES.map(l => ({ value: l.code, label: l.name }))}
                            // todo: Select should preserve type information
                            onChange={(option: {
                                value: typeof LANGUAGES[number]['code'];
                                label: typeof LANGUAGES[number]['name'];
                            }) => fetchLocale(option.value)}
                        />
                    </ActionColumn>
                </SectionItem>
            </Section>

            <Section title={<Translation id="TR_CURRENCY" />}>
                <SectionItem>
                    <TextColumn title={<Translation id="TR_PRIMARY_FIAT" />} />
                    <ActionColumn>
                        <ActionSelect
                            variant="small"
                            onChange={(option: { value: string; label: string }) =>
                                setLocalCurrency(option.value)
                            }
                            value={() => buildCurrencyOption(wallet.settings.localCurrency)}
                            options={FIAT.currencies.map(c => buildCurrencyOption(c))}
                            isDisabled={uiLocked}
                        />
                    </ActionColumn>
                </SectionItem>
            </Section>

            {/* TODO: KEEP IT HERE AND UNCOMMENT WHEN READY */}
            {/* <Section header={<Translation id="TR_LABELING" />}>
                <SectionItem>
                    <TextColumn title={<Translation id="TR_CONNECT_DROPBOX} />" />
                    <ActionColumn>
                        <ActionButton
                            onClick={() => console.log('fooo')}
                            isDisabled={uiLocked}
                            variant="secondary"
                        >
                            <Translation id="TR_CONNECT_DROPBOX" />
                        </ActionButton>
                    </ActionColumn>
                </SectionItem>
            </Section> */}

            <Analytics />

            <BottomContainer>
                <Section>
                    <SectionItem>
                        <TextColumn
                            title={<Translation id="TR_SUITE_STORAGE" />}
                            description={<Translation id="TR_CLEAR_STORAGE_DESCRIPTION" />}
                        />
                        <ActionColumn>
                            <ActionButton
                                onClick={() => {
                                    clearStores();
                                    // @ts-ignore global.ipcRenderer is declared in @desktop/preloader.js
                                    const { ipcRenderer } = global;
                                    if (ipcRenderer) {
                                        // relaunch desktop app
                                        ipcRenderer.send('restart-app');
                                    } else {
                                        // redirect to / and reload the web
                                        goto('suite-index');
                                        setTimeout(() => {
                                            // hacky way to wait until the user is redirected
                                            window.location.reload();
                                        }, 2000);
                                    }
                                }}
                                variant="secondary"
                            >
                                <Translation id="TR_CLEAR_STORAGE" />
                            </ActionButton>
                        </ActionColumn>
                    </SectionItem>
                </Section>

                <Section>
                    <SectionItem>
                        <TextColumn
                            title={<Translation id="TR_SUITE_VERSION" />}
                            description={
                                <Translation
                                    id="TR_YOUR_CURRENT_VERSION"
                                    values={{
                                        version: 'internal alfa release',
                                    }}
                                />
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
            </BottomContainer>
        </SettingsLayout>
    );
};
