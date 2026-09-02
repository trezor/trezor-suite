import type { Meta, StoryObj } from '@storybook/react-native';
import { useArgs } from 'storybook/preview-api';

import { SUB_TABS_SIZES, SubTabs as SubTabsComponent, type SubTabsProps } from '../SubTabs';

type SubTabsStory = StoryObj<SubTabsProps<string>>;

const meta: Meta<SubTabsProps<string>> = {
    title: 'Atoms/SubTabs',
    component: SubTabsComponent,
    render: args => {
        const [{ value }, updateArgs] = useArgs();

        return (
            <SubTabsComponent
                {...args}
                onChange={nextValue => updateArgs({ value: nextValue })}
                value={value}
            />
        );
    },
};

export default meta;

export const SubTabs: SubTabsStory = {
    args: {
        items: [
            { label: 'Exchange', value: 'exchange', icon: 'repeat' },
            { label: 'Buy', value: 'buy', icon: 'plus' },
            { label: 'Sell', value: 'sell', icon: 'minus' },
        ],
        size: 'normal',
        value: 'exchange',
    },
    argTypes: {
        items: {
            table: { disable: true },
        },
        keyExtractor: {
            table: { disable: true },
        },
        onChange: {
            table: { disable: true },
        },
        size: {
            control: { type: 'select' },
            options: SUB_TABS_SIZES,
        },
        testID: {
            table: { disable: true },
        },
    },
};
