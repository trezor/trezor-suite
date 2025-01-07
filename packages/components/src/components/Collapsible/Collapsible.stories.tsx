import { Meta, StoryObj } from '@storybook/react';

import { spacings } from '@trezor/theme';

import { Collapsible as CollapsibleComponent } from './Collapsible';
import { Button } from '../buttons/Button/Button';
import { Row } from '../Flex/Flex';

const meta: Meta = {
    title: 'Collapsible',
    component: CollapsibleComponent,
} as Meta;
export default meta;

export const Collapsible: StoryObj = {
    render: args => (
        <CollapsibleComponent {...args}>
            <CollapsibleComponent.Toggle>
                <Button>Toggle</Button>
            </CollapsibleComponent.Toggle>
            <CollapsibleComponent.Content>
                <Row padding={{ top: spacings.lg }}>
                    <p>
                        Lorem ipsum odor amet, consectetuer adipiscing elit. Vel hac cras ultrices
                        nullam mattis proin. In rhoncus interdum molest. Inceptos nec, aenean, nunc,
                        auctor ultricies, aenean. Velit, urna, amet, pellentesque. Ut, sit, nec,
                        amet, etiam bibendum. Dolor, ut, nec, amet, etiam bibendum. Dolor, ut, nec,
                        amet, etiam
                    </p>
                </Row>
            </CollapsibleComponent.Content>
        </CollapsibleComponent>
    ),
    args: {
        defaultIsOpen: false,
    },
    argTypes: {
        defaultIsOpen: {
            control: 'boolean',
        },
        isOpen: {
            control: 'boolean',
        },
    },
};
