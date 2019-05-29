/* @flow */
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

export const getBottomText = (error: any, warning: any, info: any): React.Node => {
    if (error) {
        return <FormattedMessage {...error} />;
    }
    if (warning) {
        return <FormattedMessage {...warning} />;
    }
    if (info) {
        return <FormattedMessage {...info} />;
    }
    return null;
};
