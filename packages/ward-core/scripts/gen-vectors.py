#!/usr/bin/env python3
"""Generate @trezor/ward-core's conformance vectors from trezorlib.ward_trie, the reference.

Run from a trezor-firmware checkout's venv (trezorlib importable), e.g.:

    TREZOR_FIRMWARE=../trezor-firmware \
        ../trezor-firmware/.venv/bin/python packages/ward-core/scripts/gen-vectors.py

Writes src/__tests__/fixtures/vectors.json. The TypeScript port must reproduce every root, proof
and commit byte for byte; regenerate when the Python reference changes.
"""

import hashlib
import json
import os
import random
import sys
from types import SimpleNamespace

sys.path.insert(0, os.path.join(os.environ.get("TREZOR_FIRMWARE", "../trezor-firmware"), "python/src"))
from trezorlib import ward_trie as wt  # noqa: E402

H = lambda b: b.hex()  # noqa: E731
HN = lambda b: None if b is None else b.hex()  # noqa: E731


def part(nonce: bytes, tag: bytes, ct: bytes) -> str:
    """A sealed part as the wire carries it: 0x01 || nonce || tag || ct, hex."""
    return H(b"\x01" + nonce + tag + ct)


def leaf(rng: random.Random) -> dict:
    body = bytes([rng.getrandbits(8)]) * rng.randint(1, 5)
    return {
        "identity": part(b"i" * 12, b"j" * 16, b"id"),
        "content": part(b"n" * 12, b"t" * 16, body),
    }


def as_leaf(d: dict):
    return SimpleNamespace(identity=bytes.fromhex(d["identity"]), content=bytes.fromhex(d["content"]))


def keys(rng, n, shared):
    prefix = bytes(rng.getrandbits(8) for _ in range(shared))
    return [prefix + bytes(rng.getrandbits(8) for _ in range(32 - shared)) for _ in range(n)]


def run(seed: int, shared: int, steps: int = 120) -> dict:
    rng = random.Random(seed)
    ks = keys(rng, 12, shared)
    store = wt.WardTrie()
    out = []
    for _ in range(steps):
        k = rng.choice(ks)
        if k in store and rng.random() < 0.4:
            op, new = "delete", None
            store.remove(k)
        else:
            op, new = ("update" if k in store else "insert"), leaf(rng)
            store.set(k, as_leaf(new))
        probe = rng.choice(ks)
        step = {"op": op, "key": H(k), "leaf": new, "root": HN(store.root())}
        if probe in store:
            step["membership"] = {"key": H(probe), "commit": H(store.commit(probe)), "proof": [H(e) for e in store.membership_proof(probe)]}
        elif len(store):
            proof, wk, wc = store.nonmembership_proof(probe)
            step["nonmembership"] = {"key": H(probe), "proof": [H(e) for e in proof], "witness_key": H(wk), "witness_commit": H(wc)}
        out.append(step)
    return {"seed": seed, "shared_prefix_bytes": shared, "steps": out}


def frozen_vectors() -> dict:
    """The firmware's shared four-leaf vectors (common/tests/fixtures/ward/trie.json), as the
    firmware, trezorlib and rust/trezor-ward pin them."""
    fw = os.environ.get("TREZOR_FIRMWARE", "../trezor-firmware")
    with open(os.path.join(fw, "common/tests/fixtures/ward/trie.json")) as f:
        v = json.load(f)
    member = next(l for l in v["leaves"] if l["entryKeyHex"] == v["memberKey"])
    return {
        "root": v["root"],
        "member": v["memberKey"],
        "member_commit": member["valueDigestHex"],
        "member_proof": v["memberProof"],
        "absent": v["absentKey"],
        "witness": v["witnessKey"],
        "witness_commit": v["witnessCommit"],
        "proof": v["nonMemberProof"],
    }


def wm_vectors() -> dict:
    """The WM's signatures, from the firmware tests' MockWM and ward_keys -- the dev WM must match."""
    fw = os.environ.get("TREZOR_FIRMWARE", "../trezor-firmware")
    sys.path.insert(0, fw)
    from tests import ward_keys as wk  # noqa: E402
    from tests.ward_wm import DEBUG_WM_SEED, MockWM  # noqa: E402

    wm = MockWM()
    k_sig = hashlib.sha256(b"ward-core test K_sig").digest()
    from trezorlib import _ed25519  # noqa: E402

    ward_id = _ed25519.publickey_unsafe(k_sig)
    r1, r2 = hashlib.sha256(b"r1").digest(), hashlib.sha256(b"r2").digest()
    rn = bytes([9]) * 32
    attest = {
        "nonce": H(rn), "ward_id": H(ward_id), "from_counter": 1, "from_root": H(r1),
        "to_counter": 2, "to_root": H(r2), "timestamp": 1700000002,
    }
    attest["signature"] = H(wm.sign(ward_id, rn, 1, r1, 2, r2, 1700000002))
    genesis = dict(attest, from_counter=0, from_root=None, to_counter=0, to_root=None)
    genesis["signature"] = H(wm.sign(ward_id, rn, 0, None, 0, None, 1700000002))
    return {
        "debug_seed": H(DEBUG_WM_SEED),
        "debug_pubkey": H(wm.pubkey),
        "k_sig": H(k_sig),
        "ward_id": H(ward_id),
        "attest": attest,
        "attest_genesis": genesis,
        # bound to the session nonce: the round nonce of the device's latest sync
        "session": H(rn),
        "wm_sig_commit": {"from_counter": 1, "from_root": H(r1), "to_counter": 2, "to_root": H(r2),
                          "sig": H(wk.wm_sig(k_sig, ward_id, 1, r1, 2, r2, wk.TAG_WM_HEAD, rn))},
        "wm_sig_revert": {"from_counter": 2, "from_root": H(r2), "to_counter": 3, "to_root": H(r1),
                          "sig": H(wk.wm_sig(k_sig, ward_id, 2, r2, 3, r1, wk.TAG_WM_REVERT, rn))},
        "head_init": {"counter": 0, "root": None, "sig": H(wk.head_init_sig(k_sig, ward_id, 0, None))},
        "empty_root": H(wk._root_or_empty(None)) if hasattr(wk, "_root_or_empty") else None,
    }


def main() -> None:
    rng = random.Random(1)
    commits = []
    for content in (part(b"a" * 12, b"b" * 16, b""), part(b"n" * 12, b"t" * 16, b"hello"), part(b"c" * 12, b"d" * 16, b"v")):
        commits.append({"content": content, "commit": H(wt.value_digest(bytes.fromhex(content)))})

    # a batch served from a staged scratch tree
    base = wt.WardTrie(); bk = keys(rng, 6, 0)
    for k in bk[:4]:
        base.set(k, as_leaf(leaf(rng)))
    staged, served = [], []
    for k in bk[2:]:
        view = base.scratch(staged)
        new = leaf(rng); c = wt.value_digest(bytes.fromhex(new["content"]))
        if k in view:
            served.append({"key": H(k), "present": True, "proof": [H(e) for e in view.membership_proof(k)], "root_before": H(view.root_or_empty())})
        else:
            p, wk, wc = view.nonmembership_proof(k)
            served.append({"key": H(k), "present": False, "proof": [H(e) for e in p], "witness_key": H(wk), "witness_commit": H(wc), "root_before": H(view.root_or_empty())})
        staged.append((k, c)); served[-1]["staged_commit"] = H(c)
    base_leaves = {H(k): {"commit": H(base.commit(k))} for k in bk[:4]}

    R = lambda t: hashlib.sha256(t.encode()).digest()  # noqa: E731
    log = wt.TransitionLog()
    for fc, fr, tc, tr, op in [(0, None, 1, R("r1"), "commit"), (1, R("r1"), 2, R("r2"), "commit"),
                               (2, R("r2"), 3, R("r3a"), "commit"), (2, R("r2"), 3, R("r3b"), "commit"),
                               (3, R("r3b"), 4, R("r4"), "commit"), (4, R("r4"), 5, R("r1"), "revert")]:
        log.record(fc, fr, tc, tr, bytes([tc]) * 32, op)
    links = [{"from_counter": l[0], "from_root": HN(l[1]), "to_counter": l[2], "to_root": HN(l[3]), "auth_commit": H(l[4]), "operation": l[5]} for l in log.links]

    vectors = {
        "empty_root": H(wt.EMPTY_ROOT),
        "frozen": frozen_vectors(),
        "commits": commits,
        "runs": [run(3, 0), run(4, 20)],
        "batch": {"base": base_leaves, "base_root": H(base.root_or_empty()), "served": served},
        "log": {"links": links,
                "ending_at": [{"to_counter": 5, "to_root": H(R("r1")), "counters": [l[2] for l in log.links_ending_at(5, R("r1"))]}],
                "fork_point": [{"a": [3, H(R("r3a"))], "b": [4, H(R("r4"))], "k": log.fork_point((3, R("r3a")), (4, R("r4")))},
                               {"a": [3, H(R("zz"))], "b": [4, H(R("r4"))], "k": log.fork_point((3, R("zz")), (4, R("r4")))}]},
    }
    vectors["wm"] = wm_vectors()
    path = os.path.join(os.path.dirname(__file__), "../src/__tests__/fixtures/vectors.json")
    with open(path, "w") as f:
        json.dump(vectors, f, indent=1)
        f.write("\n")
    print("wrote", os.path.normpath(path))


if __name__ == "__main__":
    main()
