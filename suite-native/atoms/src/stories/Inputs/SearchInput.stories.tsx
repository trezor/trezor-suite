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
        maxLength: 100,
        onChange: () => {},
    },
    argTypes: {
        placeholder: {
            control: { type: 'text' },
        },
        maxLength: {
            control: { type: 'number' },
        },
    },
};
