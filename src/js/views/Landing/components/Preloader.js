/* @flow */


import React from 'react';
import Loader from 'components/common/LoaderCircle';

export default (props: {}): React$Element<string> => (
    <section className="landing">
        <Loader label="Loading" size="100" />
    </section>
);