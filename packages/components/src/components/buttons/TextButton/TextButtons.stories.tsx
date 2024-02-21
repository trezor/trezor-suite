import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { TextButton } from '../../../index';
import { StoryColumn } from '../../../support/Story';

export default {
    title: 'Buttons/TextButton/All',
} as Meta;

export const All: StoryFn = () => (
    <>
        <StoryColumn minWidth={350} maxWidth={420}>
            <TextButton
                data-test-id="text-button"
                onClick={() => {
                    console.log('click');
                }}
            >
                Text Button
            </TextButton>
            <TextButton
                size="medium"
                data-test-id="text-button"
                onClick={() => {
                    console.log('click');
                }}
            >
                Text Button Medium
            </TextButton>

            <TextButton
                size="small"
                data-test-id="text-button"
                onClick={() => {
                    console.log('click');
                }}
            >
                Text Button Small
            </TextButton>

            <TextButton
                data-test-id="text-button-icon"
                icon="GHOST"
                onClick={() => {
                    console.log('click');
                }}
            >
                Text Button Icon
            </TextButton>

            <TextButton icon="GHOST" data-test-id="text-button-loading" isLoading>
                Text Button loading
            </TextButton>

            <TextButton
                icon="GHOST"
                isDisabled
                data-test-id="text-button-disabled"
                onClick={() => {
                    console.log('click');
                }}
            >
                Text Button disabled
            </TextButton>
        </StoryColumn>
    </>
);
