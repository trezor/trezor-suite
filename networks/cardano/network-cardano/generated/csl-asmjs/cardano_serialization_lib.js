import * as wasm from "./cardano_serialization_lib.asm.js";
import { __wbg_set_wasm } from "./cardano_serialization_lib_bg.js";
__wbg_set_wasm(wasm);
export * from "./cardano_serialization_lib_bg.js";
