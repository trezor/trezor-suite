import React from 'react';
import { Loader } from './Loader';

export default {
    title: 'Loaders/Loader',
    args: {
        size: 50,
        strokeWidth: 1,
    },
};

export const Basic = ({ ...args }) => <Loader size={args.size} strokeWidth={args.strokeWidth} />;
