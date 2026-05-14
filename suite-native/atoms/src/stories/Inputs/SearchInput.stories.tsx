import type { Meta, StoryObj } from '@storybook/react-native';

import {
    SearchInput as SearchInputComponent,
    type SearchInputProps,
} from '../../Input/SearchInput';

type SearchInputStory = StoryObj<SearchInputProps>;

const meta: Meta<SearchInputProps> = {
    title: 'Atoms/Inputs',
    component: SearchInputComponent,
};

export default meta;

export const SearchInput: SearchInputStory = {
    name: 'SearchInput',
    args: {
        placeholder: 'Search for something',
        isDisabled: false,
        maxLength: 100,
        elevation: '0',
        onChange: () => {},
    },
    argTypes: {
        placeholder: {
            control: { type: 'text' },
        },
        isDisabled: {
            control: { type: 'boolean' },
        },
        maxLength: {
            control: { type: 'number' },
        },
        elevation: {
            control: { type: 'select' },
            options: ['0', '1'],
        },
    },
};
