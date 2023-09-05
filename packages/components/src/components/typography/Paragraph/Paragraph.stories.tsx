import { P } from '../../../index';
import { storiesOf } from '@storybook/react';
import { select, text } from '@storybook/addon-knobs';

storiesOf('Typography/Paragraph', module).add('Paragraph', () => {
    const value = text('Value', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.');
    const textAlign: any = select(
        'Align',
        {
            Left: 'left',
            Right: 'right',
            Center: 'center',
        },
        'left',
    );
    const size: any = select(
        'Size',
        {
            Normal: 'normal',
            Small: 'small',
            Tiny: 'tiny',
        },
        'normal',
    );
    const weight: any = select(
        'Weight',
        {
            Normal: 'normal',
            Bold: 'bold',
        },
        'normal',
    );

    return (
        <P
            {...(textAlign !== 'left' ? { textAlign } : {})}
            {...(size !== 'normal' ? { size } : {})}
            {...(weight !== 'normal' ? { weight } : {})}
        >
            {value}
        </P>
    );
});
