/* @flow */


import React from 'react';

export default (props: { size: string, label?: string }): React$Element<string> => {
    const style = {
        width: `${props.size}px`,
        height: `${props.size}px`,
    };

    return (
        <div className="loader-circle" style={style}>
            <p>{ props.label }</p>
            <svg className="circular" viewBox="25 25 50 50">
                <circle className="route" cx="50" cy="50" r="20" fill="none" stroke="" strokeWidth="1" strokeMiterlimit="10" />
                <circle className="path" cx="50" cy="50" r="20" fill="none" strokeWidth="1" strokeMiterlimit="10" />
            </svg>
        </div>
    );
};