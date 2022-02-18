import React from 'react';
import { H1, LoadingContent } from '../../../index';
import { storiesOf } from '@storybook/react';
import { number, boolean } from '@storybook/addon-knobs';

storiesOf('Loaders', module).add('Loading content', () => {
    const size = number('Size', 20);
    const loading = boolean('Is loading', true);
    return (
        <LoadingContent size={size} isLoading={loading}>
            <H1 noMargin>$1337</H1>
        </LoadingContent>
    );
});
