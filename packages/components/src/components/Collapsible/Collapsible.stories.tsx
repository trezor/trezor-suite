import { Meta, StoryObj } from '@storybook/react';

import { spacings } from '@trezor/theme';

import { Collapsible as CollapsibleComponent } from './Collapsible';
import { NewButton } from '../buttons/NewButton/NewButton';

const meta: Meta<typeof CollapsibleComponent> = {
    title: 'Collapsible',
    component: CollapsibleComponent,
};
export default meta;

export const Collapsible: StoryObj<typeof CollapsibleComponent> = {
    render: args => (
        <CollapsibleComponent {...args}>
            <CollapsibleComponent.Toggle>
                <NewButton>Toggle</NewButton>
            </CollapsibleComponent.Toggle>
            <CollapsibleComponent.Content>
                <p>
                    Lorem ipsum odor amet, consectetuer adipiscing elit. Vel hac cras ultrices
                    nullam mattis proin. In rhoncus interdum molest. Inceptos nec, aenean, nunc,
                    auctor ultricies, aenean. Velit, urna, amet, pellentesque. Ut, sit, nec, amet,
                    etiam bibendum. Dolor, ut, nec, amet, etiam bibendum. Dolor, ut, nec, amet,
                    etiam
                </p>
            </CollapsibleComponent.Content>
        </CollapsibleComponent>
    ),
    args: {
        defaultIsOpen: false,
        gap: spacings.lg,
    },
    argTypes: {
        defaultIsOpen: {
            control: 'boolean',
        },
        isOpen: {
            control: 'boolean',
        },
        gap: {
            control: 'select',
            options: Object.values(spacings),
        },
    },
};
