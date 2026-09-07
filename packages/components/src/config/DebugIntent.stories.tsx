import { type Meta, type StoryObj } from '@storybook/react';
import { ThemeProvider } from 'styled-components';

import { BugIcon } from '@trezor/icons';

import { intermediaryTheme } from './colors';
import { Badge } from '../components/Badge/Badge';
import { Banner } from '../components/Banner/Banner';
import { Box } from '../components/Box/Box';
import { Column, Row } from '../components/Flex/Flex';
import { IconCircle } from '../components/IconCircle/IconCircle';
import { Button } from '../components/buttons/Button/Button';
import { IconButton } from '../components/buttons/IconButton/IconButton';
import { TextButton } from '../components/buttons/TextButton/TextButton';
import { Checkbox } from '../components/form/Checkbox/Checkbox';
import { Radio } from '../components/form/Radio/Radio';
import { Switch } from '../components/form/Switch/Switch';
import { Text } from '../components/typography/Text/Text';

const meta: Meta = {
    title: 'Debug intent',
    parameters: {
        docs: {
            description: {
                component:
                    'Reserved for developer tools and debug-only UI. Visibility must still be gated by the application.',
            },
        },
    },
};

export default meta;

export const BothThemes: StoryObj = {
    render: () => (
        <Row gap={24} alignItems="flex-start">
            {(['light', 'dark'] as const).map(mode => (
                <ThemeProvider key={mode} theme={{ ...intermediaryTheme[mode], variant: mode }}>
                    <Box
                        backgroundColor="surfaceFillPage"
                        padding={24}
                        width={520}
                        borderRadius={16}
                    >
                        <Column gap={24} alignItems="stretch">
                            <Text typographyStyle="headline-sm" color="contentPrimary">
                                Debug UI · {mode}
                            </Text>
                            <Box backgroundColor="surfaceFillRaised" padding={16} borderRadius={12}>
                                <Column gap={20} alignItems="stretch">
                                    <Row gap={8}>
                                        <Text color="contentPrimary">Debug activity</Text>
                                        <Badge intent="debug" size="small">
                                            Debug only
                                        </Badge>
                                    </Row>
                                    <Text color="contentPrimary">
                                        Trigger activity notification
                                    </Text>
                                    <Text color="contentSecondary" typographyStyle="body-sm">
                                        Add a notification/activity entry to test the Activity page.
                                    </Text>
                                    <Checkbox intent="debug" isChecked onChange={() => {}}>
                                        <Text color="contentPrimary">Add as unseen (new)</Text>
                                    </Checkbox>
                                    <Row justifyContent="flex-end">
                                        <Button intent="debug">Add activity</Button>
                                    </Row>
                                </Column>
                            </Box>
                            <Row gap={12}>
                                <Button intent="debug">Primary</Button>
                                <Button intent="debug" priority="secondary">
                                    Secondary
                                </Button>
                                <IconButton
                                    intent="debug"
                                    icon={BugIcon}
                                    tooltip={{ content: 'Debug' }}
                                    aria-label="Debug"
                                />
                            </Row>
                            <Row gap={12}>
                                <Button intent="debug" isDisabled>
                                    Disabled
                                </Button>
                                <Button intent="debug" isLoading>
                                    Loading
                                </Button>
                                <TextButton intent="debug">Diagnostics</TextButton>
                            </Row>
                            <Row gap={16}>
                                <Switch intent="debug" isChecked />
                                <Radio intent="debug" isChecked onChange={() => {}} />
                                <IconCircle intent="debug" icon={BugIcon} size={40} />
                                <Badge intent="debug" iconLeft={BugIcon}>
                                    Debug only
                                </Badge>
                            </Row>
                            <Banner
                                intent="debug"
                                icon
                                title="Developer tools"
                                description="Diagnostic controls use pink."
                            />
                        </Column>
                    </Box>
                </ThemeProvider>
            ))}
        </Row>
    ),
};
