type CircuitHopsProps = {
    path: string;
};

// Glowing dots at the circuit's three relays.
export const CircuitHops = ({ path }: CircuitHopsProps) => (
    <g className="hops" strokeDasharray="0 0.2 0 0.2 0 2" strokeDashoffset="-0.24">
        <path d={path} pathLength="1" strokeWidth="10" strokeOpacity="0.14" />
        <path d={path} pathLength="1" strokeWidth="3.8" />
    </g>
);
