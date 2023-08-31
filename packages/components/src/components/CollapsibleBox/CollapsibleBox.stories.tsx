import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { boolean, select } from '@storybook/addon-knobs';

import { CollapsibleBox } from './CollapsibleBox';

const Content = styled.div`
    width: 400px;
`;

storiesOf('Misc/CollapsibleBox', module).add('CollapsibleBox', () => {
    const placement = select(
        'Variant',
        {
            Large: 'large',
            Small: 'small',
            Tiny: 'tiny',
        },
        'small',
    );

    const headerJustifyContent = select(
        'Header content alignent',
        {
            'Space between': 'space-between',
            Center: 'center',
        },
        'space-between',
    );

    const iconLabel = boolean('Icon label', false);

    return (
        <CollapsibleBox
            heading={<span>Test Box</span>}
            variant={placement}
            headerJustifyContent={headerJustifyContent}
            headingButton={iconLabel ? () => <span>See more</span> : undefined}
        >
            <Content>Some content</Content>
        </CollapsibleBox>
    );
});
