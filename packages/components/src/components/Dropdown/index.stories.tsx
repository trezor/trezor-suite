import React from 'react';
import { Dropdown } from './index';
import { storiesOf } from '@storybook/react';
import { select, number, boolean } from '@storybook/addon-knobs';

storiesOf('Dropdown', module).add(
    'Dropdown',
    () => {
        const alignMenu: any = select(
            'alignMenu',
            {
                default: null,
                left: 'left',
                right: 'right',
            },
            null
        );
        const isDisabled = boolean('isDisabled', false);
        const offset = number('offset', 10);

        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Dropdown
                    {...(alignMenu ? { alignMenu } : {})}
                    {...(offset ? { offset } : {})}
                    {...(isDisabled ? { isDisabled } : {})}
                    items={[
                        // {
                        //     options: [
                        //         {
                        //             label: 'item without a group',
                        //             callback: () => {
                        //                 console.log('item 1 clicked');
                        //             },
                        //         },
                        //     ],
                        // },
                        {
                            key: '1',
                            label: 'Group 1',
                            options: [
                                {
                                    key: '1',
                                    label: 'item 1',
                                    callback: () => {
                                        console.log('item 1 clicked');
                                    },
                                },
                                {
                                    key: '2',
                                    label: 'item 2',
                                    callback: () => {
                                        console.log('item 2 clicked');
                                    },
                                },
                            ],
                        },
                        {
                            key: '2',
                            label: 'Group 2',
                            options: [
                                {
                                    key: '1',
                                    label: 'item 3 with very long name',
                                    callback: () => {
                                        console.log('item 3 clicked');
                                    },
                                },
                                {
                                    key: '2',
                                    label: 'disabled item',
                                    callback: () => {
                                        console.log('disabled item clicked');
                                    },
                                    isDisabled: true,
                                },

                                {
                                    key: '3',
                                    label: 'item 4',
                                    callback: () => {
                                        console.log('item 4 clicked');
                                    },
                                },
                            ],
                        },
                    ]}
                />
            </div>
        );
    },
    {
        info: {
            text: `
            ~~~js
            import { Dropdown } from '../../index';
            ~~~
            `,
        },
    }
);
