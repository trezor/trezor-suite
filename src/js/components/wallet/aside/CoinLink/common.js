import PropTypes from 'prop-types';

export const coinProp = {
    coin: PropTypes.shape({
        img: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    }).isRequired,
};
