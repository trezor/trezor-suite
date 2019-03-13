/* @flow */

import React from 'react';

export default (props) => (
    <div className="batch">
        <div className="remove-batch" title="Remove batch" onClick={ props.onRemove }>
            <svg version="1.1" viewBox="0 0 500 500" width="16px" height="16px">
                <path d="M280.5,153h-51v76.5H153v51h76.5V357h51v-76.5H357v-51h-76.5V153z M255,0C114.75,0,0,114.75,0,255s114.75,255,255,255 s255-114.75,255-255S395.25,0,255,0z M255,459c-112.2,0-204-91.8-204-204S142.8,51,255,51s204,91.8,204,204S367.2,459,255,459z" />
            </svg>
        </div>
        { props.children }
    </div>
);