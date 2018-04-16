/* @flow */
'use strict';

import React from 'react';
import Loader from '../common/LoaderCircle';

export default (props: {}): React$Element<string> => {
    return (
        <section className="landing">
            <Loader label="Loading" size="100" />
        </section>
    );
}