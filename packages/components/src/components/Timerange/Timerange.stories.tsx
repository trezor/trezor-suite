import { type Meta, type StoryObj } from '@storybook/react';
import styled from 'styled-components';

import { Timerange as TimerangeComponent, type TimerangeProps } from './Timerange';

const Center = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 100px 0;
`;

const meta: Meta<typeof TimerangeComponent> = {
    title: 'Timerange',
    component: TimerangeComponent,
};
export default meta;

export const Timerange: StoryObj<TimerangeProps> = {
    render: args => (
        <Center>
            <TimerangeComponent
                startDate={args.startDate}
                endDate={args.endDate}
                onSubmit={() => {}}
                onCancel={() => {}}
                ctaSubmit={args.ctaSubmit}
                ctaCancel={args.ctaCancel}
            />
        </Center>
    ),
    args: {
        ctaSubmit: 'Confirm',
        ctaCancel: 'Cancel',
    },
    argTypes: {
        ctaSubmit: {
            type: 'string',
        },
        ctaCancel: {
            type: 'string',
        },
        startDate: {
            control: 'date',
        },
        endDate: {
            control: 'date',
        },
    },
};
