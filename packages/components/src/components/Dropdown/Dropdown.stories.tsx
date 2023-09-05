import { Dropdown } from './Dropdown';
import { storiesOf } from '@storybook/react';
import { select, number, boolean } from '@storybook/addon-knobs';

storiesOf('Misc/Dropdown', module).add('Dropdown', () => {
    const alignMenu: any = select(
        'alignMenu',
        {
            default: null,
            left: 'left',
            right: 'right',
        },
        null,
    );
    const isDisabled = boolean('isDisabled', false);
    const offset = number('offset', 10);
    const horizontalPadding = number('Horizontal padding', 8);
    const topPadding = number('Top padding', 8);
    const bottomPadding = number('Bottom padding', 8);
    const minWidth = number('Minimum width', 350);

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Dropdown
                {...(alignMenu ? { alignMenu } : {})}
                {...(offset ? { offset } : {})}
                {...(isDisabled ? { isDisabled } : {})}
                horizontalPadding={horizontalPadding}
                topPadding={topPadding}
                bottomPadding={bottomPadding}
                minWidth={minWidth}
                masterLink={{
                    callback: () => {
                        console.log('navigate somewhere');
                    },
                    label: 'some link',
                    icon: 'ARROW_RIGHT_LONG',
                }}
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
                        label: 'Group 2 - with rounded items',
                        options: [
                            {
                                key: '1',
                                label: 'item 3 with very long name',
                                callback: () => {
                                    console.log('item 1 clicked');
                                },
                                isRounded: true,
                            },
                            {
                                key: '2',
                                label: 'disabled item with icon',
                                callback: () => {
                                    console.log('item 2 clicked - disabled');
                                },
                                icon: 'LIGHTBULB',
                                isRounded: true,
                                isDisabled: true,
                            },
                            {
                                key: '3',
                                label: 'disabled item with iconRight',
                                callback: () => {
                                    console.log('item 3 clicked - disabled');
                                },
                                iconRight: 'ARROW_RIGHT',
                                isRounded: true,
                                isDisabled: true,
                            },
                            {
                                key: '4',
                                label: 'basic item',
                                callback: () => {
                                    console.log('item 4 clicked');
                                },
                                isRounded: true,
                            },
                            {
                                key: '5',
                                label: 'item with iconRight and separator',
                                callback: () => {
                                    console.log('item 5 clicked');
                                },
                                iconRight: 'ARROW_RIGHT',
                                separatorBefore: true,
                            },
                        ],
                    },
                ]}
            />
        </div>
    );
});
