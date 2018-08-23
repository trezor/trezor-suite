import React from 'react';
import PropTypes from 'prop-types';

const Icon = ({ icon, size = 32, color = 'black' }) => {
    const styles = {
        svg: {
            display: 'inline-block',
            verticalAlign: 'middle',
        },
        path: {
            fill: color,
        },
    };


    return (
        <svg
            style={styles.svg}
            width={`${size}`}
            height={`${size}`}
            viewBox="0 0 1024 1024"
        >
            {icon.map(iconPath => (
                <path
                    key={iconPath}
                    style={styles.path}
                    d={iconPath}
                />
            ))}
        </svg>
    );
};

Icon.propTypes = {
    icon: PropTypes.arrayOf(PropTypes.string).isRequired,
    size: PropTypes.number,
    color: PropTypes.string,
};


export default Icon;