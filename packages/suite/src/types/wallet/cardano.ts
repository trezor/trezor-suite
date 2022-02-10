export type DerivationType =
    | {
          value: 0;
          label: 'Ledger';
      }
    | {
          value: 1;
          label: 'Icarus';
      }
    | { value: 2; label: 'Icarus Trezor' };
