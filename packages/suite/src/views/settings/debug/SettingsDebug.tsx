import React from 'react';

import { SettingsLayout } from '@settings-components';
import { Section } from '@suite-components/Settings';
import { isWeb } from '@suite-utils/env';

import { TranslationMode } from './TranslationMode';
import { GithubIssue } from './GithubIssue';
import { WipeData } from './WipeData';
import { InvityApi } from './InvityApi';

const SettingsDebug = () => (
    <SettingsLayout>
        {isWeb() && (
            <Section title="Localization">
                <TranslationMode />
            </Section>
        )}
        <Section title="Debug">
            <GithubIssue />
            {!isWeb() && <WipeData />}
        </Section>
        <Section title="Invity">
            <InvityApi />
        </Section>
    </SettingsLayout>
);

export default SettingsDebug;
