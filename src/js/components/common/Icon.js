import React from 'react';
import PropTypes from 'prop-types';

const Icon = (props) => {
    const styles = {
        svg: {
            display: 'inline-block',
            verticalAlign: 'middle',
        },
        path: {
            fill: props.color,
        },
    };

    return (
        <svg
            style={styles.svg}
            width={`${props.size}`}
            height={`${props.size}`}
            viewBox="0 0 16 16"
        >
            <path
                style={styles.path}
                d={props.icon}

            />
        </svg>
    );
};

Icon.propTypes = {
    icon: PropTypes.string.isRequired,
    size: PropTypes.number,
    color: PropTypes.string,
};

Icon.defaultProps = {
    size: 30,
    color: 'black',
};

export default Icon;