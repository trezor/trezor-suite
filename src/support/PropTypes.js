import PropTypes from 'prop-types';

export const DEVICE_PROP_TYPES = PropTypes.shape({
    id: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired,
    author: authorPropType.isRequired,
});