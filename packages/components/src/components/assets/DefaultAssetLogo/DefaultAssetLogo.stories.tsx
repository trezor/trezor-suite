import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';
import {
    DefaultAssetLogo as DefaultAssetLogoComponent,
    DefaultAssetLogoProps,
} from './DefaultAssetLogo';

const Center = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 100px 0;
`;

const meta: Meta = {
    title: 'Assets/DefaultAssetLogo',
    component: DefaultAssetLogoComponent,
} as Meta;
export default meta;

export const DefaultAssetLogo: StoryObj<DefaultAssetLogoProps> = {
    render: props => (
        <Center>
            <DefaultAssetLogoComponent {...props} />
        </Center>
    ),
    args: {
        size: 32,
    },
    argTypes: {
        coinFirstCharacter: {
            type: 'string',
        },
        size: {
            type: 'number',
        },
    },
};
