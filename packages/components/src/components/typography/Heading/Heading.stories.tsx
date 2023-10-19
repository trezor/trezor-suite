import { H1, H2 } from '../../../index';
import { storiesOf } from '@storybook/react';
import { select, text } from '@storybook/addon-knobs';

H1.displayName = 'H1';
H2.displayName = 'H2';

storiesOf('Typography/Heading', module).add('Heading', () => {
    const value = text('Value', 'Heading');
    const size: any = select(
        'Size',
        {
            H1: 'H1',
            H2: 'H2',
        },
        'H1',
    );
    const textAlign: any = select(
        'Align',
        {
            Left: 'left',
            Right: 'right',
            Center: 'center',
        },
        'left',
    );

    if (size === 'H1') {
        return <H1 {...(textAlign !== 'left' ? { textAlign } : {})}>{value}</H1>;
    }
    return <H2 {...(textAlign !== 'left' ? { textAlign } : {})}>{value}</H2>;
});
