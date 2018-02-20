/* @flow */
'use strict';

import React from 'react';
import Loader from '../common/LoaderCircle';

export default (props: any): any => {
    return (
        <section className="landing">
            <Loader label="Loading" size="100" />
        </section>
    );
}