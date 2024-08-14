import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { TextButton } from '../../../index';
import { StoryColumn } from '../../../support/Story';

const meta: Meta = {
    title: 'Buttons',
} as Meta;
export default meta;

export const AllTextButtons: StoryFn = () => (
    <>
        <StoryColumn minWidth={350} maxWidth={420}>
            <TextButton
                data-testid="text-button"
                onClick={() => {
                    console.log('click');
                }}
            >
                Text Button
            </TextButton>
            <TextButton
                size="medium"
                data-testid="text-button"
                onClick={() => {
                    console.log('click');
                }}
            >
                Text Button Medium
            </TextButton>

            <TextButton
                size="small"
                data-testid="text-button"
                onClick={() => {
                    console.log('click');
                }}
            >
                Text Button Small
            </TextButton>

            <TextButton
                data-testid="text-button-icon"
                icon="GHOST"
                onClick={() => {
                    console.log('click');
                }}
            >
                Text Button Icon
            </TextButton>

            <TextButton icon="GHOST" data-testid="text-button-loading" isLoading>
                Text Button loading
            </TextButton>

            <TextButton
                icon="GHOST"
                isDisabled
                data-testid="text-button-disabled"
                onClick={() => {
                    console.log('click');
                }}
            >
                Text Button disabled
            </TextButton>
        </StoryColumn>
    </>
);
