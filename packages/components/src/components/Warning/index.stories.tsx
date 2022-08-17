import React from 'react';
import { Warning } from '../../index';

export default {
    title: 'Misc/Warning',
    parameters: {
        options: {
            showPanel: false,
        },
    },
};

export const Basic = () => <Warning>Warning! Here dragons abound. 🐲</Warning>;
