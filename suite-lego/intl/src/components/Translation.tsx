import { FormattedMessage } from 'react-intl';

import { messages } from '../messages';
import { type ExtendedMessageDescriptor } from '../types';

export const Translation = ({ defaultMessage, id, values }: ExtendedMessageDescriptor) => {
    // prevent runtime errors
    if (!defaultMessage && id !== undefined && !messages[id]) {
        return <>{`Unknown translation id: ${id}`}</>;
    }

    return (
        <FormattedMessage
            id={id}
            tagName="span"
            defaultMessage={defaultMessage || messages[id].defaultMessage}
            values={values !== undefined && Object.keys(values).length === 0 ? undefined : values} // needed due to: "exactOptionalPropertyTypes": true
        />
    );
};
