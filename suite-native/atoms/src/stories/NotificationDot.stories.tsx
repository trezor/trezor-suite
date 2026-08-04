import type { Meta, StoryObj } from '@storybook/react-native';

import { NotificationDot } from '../NotificationDot';

type NotificationDotStory = StoryObj<typeof NotificationDot>;

const meta: Meta<typeof NotificationDot> = {
    title: 'Atoms',
    component: NotificationDot,
    render: () => <NotificationDot />,
};

export default meta;

export const NotificationDotStory: NotificationDotStory = {
    name: 'NotificationDot',
};
