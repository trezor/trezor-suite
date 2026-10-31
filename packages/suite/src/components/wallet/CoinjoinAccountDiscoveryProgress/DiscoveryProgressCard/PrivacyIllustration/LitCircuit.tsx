import { type FetchIdentityIndex } from '@trezor/coinjoin';

import { ART, CIRCUIT_LABELS, getReturnPath } from './illustrationData';

type LitCircuitProps = {
    identity: FetchIdentityIndex;
    label: string;
};

// Mounted anew for every light-up, so its animations always start from the beginning.
export const LitCircuit = ({ identity, label }: LitCircuitProps) => {
    const path = ART.circuits[identity];
    const [labelX, labelY] = CIRCUIT_LABELS[identity];

    return (
        <>
            <g stroke="var(--violet)" strokeWidth="1.3">
                <path className="circuit" d={path} pathLength="1" strokeDasharray="1 1" />
                {/* Glowing dots at the circuit's three relays. */}
                <g className="hops" strokeDasharray="0 0.2 0 0.2 0 2" strokeDashoffset="-0.24">
                    <path d={path} pathLength="1" strokeWidth="10" strokeOpacity="0.14" />
                    <path d={path} pathLength="1" strokeWidth="3.8" />
                </g>
            </g>
            <text className="circuit-label" x={labelX} y={labelY} fill="var(--violet)">
                {label}
            </text>
            <g
                className="packet"
                fill="var(--violet)"
                display="none"
                style={{ offsetPath: getReturnPath(path) }}
            >
                <circle r="7" opacity="0.18" />
                <circle r="2.6" />
            </g>
        </>
    );
};
