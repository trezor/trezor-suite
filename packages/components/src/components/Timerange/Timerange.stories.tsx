import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';
import { Timerange as TimerangeComponent, TimerangeProps } from './Timerange';

const Center = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 100px 0px;
`;

export default {
    title: 'Misc/Timerange',
    component: TimerangeComponent,
} as Meta;

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
