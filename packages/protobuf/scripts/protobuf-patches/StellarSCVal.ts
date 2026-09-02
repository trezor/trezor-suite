// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// StellarSCVal replacement
// StellarSCVal and StellarSCValMapEntry are mutually recursive
// (StellarSCVal.map -> StellarSCValMapEntry -> StellarSCVal). Two eager `const`
// schemas cannot reference each other regardless of order (temporal dead zone),
// and a single Type.Recursive `This` can only express self-reference. So inline
// the map entry here and let typebox-codegen emit one self-referential
// Type.Recursive. StellarSCValMapEntry has no standalone shape here (its `key`
// and `value` are inlined above), so it is added to SKIP in
// protobuf-patches/index.ts — nothing else references it.

export type StellarSCVal = {
    type: StellarSCValType;
    b?: boolean;
    u32?: number;
    i32?: number;
    u64?: UintType; // uint64
    i64?: SintType; // sint64
    timepoint?: UintType; // uint64
    duration?: UintType; // uint64
    u128?: StellarUInt128Parts;
    i128?: StellarInt128Parts;
    u256?: StellarUInt256Parts;
    i256?: StellarInt256Parts;
    bytes?: string;
    string?: string;
    symbol?: string;
    vec?: StellarSCVal[]; // repeated, only for SCV_VEC
    map?: { key: StellarSCVal; value: StellarSCVal }[]; // repeated, only for SCV_MAP
    address?: string;
};

// StellarSCVal replacement end
