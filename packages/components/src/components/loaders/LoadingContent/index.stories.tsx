import React from 'react';
import { H1, LoadingContent } from '../../../index';

export default {
    title: 'Loaders/Loading content',
    args: {
        size: 20,
        isLoading: true,
    },
};

export const Basic = ({ ...args }) => (
    <LoadingContent size={args.size} isLoading={args.isLoading}>
        <H1 noMargin>$1337</H1>
    </LoadingContent>
);
