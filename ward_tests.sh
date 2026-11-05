if true; then
	git fetch && git pull
fi



if true; then
	# Kill any stale emulator from a previous run -- otherwise it keeps UDP port 21324
	# and serves its old in-memory flash, so the erase below never actually takes effect
	# and the device stays desynced from the (wiped) host DB.
	pkill -f core/emu.py; sleep 1
	rm ~/.trezor/auth_database_* #packages/connect-cli/src/bitcoin-addresses.db
	( cd ~/GitHub/trezor-firmware && xtask build firmware --model t3w1 -e -d --pyopt false && timeout 30s ./core/emu.py -e )
	( cd ~/GitHub/trezor-firmware && xtask build firmware --model t3w1 -e -d --pyopt false && ./core/emu.py ) &
#	( cd ~/GitHub/trezor-firmware && sleep 5 && pytest tests/device_tests/misc/test_ward.py -k finalize_bad_signature_rejected -q 2>&1 | tee finalize_bad_signature_rejected.log )
	sleep 5
fi

yarn workspace @trezor/connect-cli udp --autoconnect
# NOTE: dbclear / AuthDbClearRoot was removed — AuthDB now has no clear-root RPC by
# design (the device's global counter is authoritative and monotonic). The device's
# AuthDB state is reset ONLY by wiping the emulator flash (the erased `./core/emu.py -e`
# above). If the emulator is not truly erased, the device keeps its counter while the
# host DB (wiped on line 12) starts at 0, and dbchange fails with
# "new_counter must equal current global counter + 1". Ensure the emulator really erased.


if true; then
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbdisplay --db-params='{"address":"deleteMe","networkSymbol":"TEST"}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"deleteMe","networkSymbol":"TEST","metadata":{"label":"Petr_deleteMeLabel"}}'

	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbdisplay --db-params='{"address":"deleteMe","networkSymbol":"TEST"}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange   --db-params='{"address":"deleteMe","networkSymbol":"TEST","delete":true}'

	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbdisplay --db-params='{"address":"deleteMe","networkSymbol":"TEST"}'

	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"deleteMe","networkSymbol":"TEST"}'

	# Deleting again must FAIL fast ("nothing to delete") rather than write a second leaf.
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbdelete --db-params='{"address":"deleteMe","networkSymbol":"TEST"}'
	# A tombstone check: dbchange with metadata:{} is an UPDATE, so adr1 must still be a
	# MEMBER afterwards -- it must NOT look deleted.
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"adr1","networkSymbol":"TEST","metadata":{}}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"adr1","networkSymbol":"TEST"}'
	#Expect: isMember TRUE (metadata:{} updated the value, it did not delete)
    yarn workspace @trezor/connect-cli udp --autoconnect --method=dbdisplay --db-params='{"address":"deleteMe","networkSymbol":"TEST"}'
    
fi

yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"first","networkSymbol":"TEST"}'
yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"second","networkSymbol":"TEST","metadata":{"label":"Adr1_v0"}}'
yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"third","networkSymbol":"TEST"}'
yarn workspace @trezor/connect-cli udp --autoconnect --method=dbdisplay --db-params='{"address":"second","networkSymbol":"TEST"}'
pkill -f core/emu.py; sleep 1


# The device's AuthDB tree must match the freshly-wiped host DB. Since dbclear was
# removed, the ONLY reset is a true emulator flash erase (above). If the emulator keeps
# a stale tree while the host DB starts empty, every insert is built as an INIT (empty
# proof) against a non-empty device, or the global counters diverge -- both are rejected.
# If you cannot reliably erase the emulator, delete its flash/profile before this run.

if false; then
	for i in `seq 1 1 16`; do
		for j in `seq 1 1 2`; do
			echo Stage $i, run $j  
			eval yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params=\''{"address":"next'${i}'","networkSymbol":"TEST","metadata":{"label":"'Petr_next${i}_v${j}'"}}'\'
			echo "===== Finished $i, run $j ====="
		done
	done
fi

if true; then
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbdisplay --db-params='{"address":"adr1","networkSymbol":"TEST"}'
		# ISSUE: non-membership : not verified
		# "No Merkle root stored on device"  --> for each element,  Authenticity verified (non-membership): true
		# we should call reset_root

	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"adr1","networkSymbol":"TEST","metadata":{"label":"Petr_adr1_v0"}}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbdisplay --db-params='{"address":"adr1","networkSymbol":"TEST"}'


	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"adr1","networkSymbol":"TEST"}'
	#Authenticity verified: true


	# Unrelated entries survive the delete.
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbdisplay --db-params='{"address":"adr1","networkSymbol":"TEST"}'
fi

if false; then

	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"adr1","networkSymbol":"TEST"}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"adr1","networkSymbol":"TEST","metadata":{"label":"Petr_adr1_v1"}}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"adr1","networkSymbol":"TEST"}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"adr1","networkSymbol":"TEST","metadata":{"label":"Petr_adr1_v2"}}'

	# dbdisplay drives the DisplayAddress flow so the device SHOWS the verified label
	# on-screen (membership) -- unlike dblookup, which is a screenless verification query.
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbdisplay --db-params='{"address":"adr1","networkSymbol":"TEST"}'
	# non-membership: the device shows the address with no label
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbdisplay --db-params='{"address":"notThere","networkSymbol":"TEST"}'

	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"adr2","networkSymbol":"TEST"}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"adr2","networkSymbol":"TEST","metadata":{"label":"Petr_adr2_v0"}}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"adr2","networkSymbol":"TEST"}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"adr2","networkSymbol":"TEST","metadata":{"label":"Petr_adr2_v1"}}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"adr2","networkSymbol":"TEST"}'

	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"adr3","networkSymbol":"TEST"}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"adr3","networkSymbol":"TEST","metadata":{"label":"Petr_adr2_v0"}}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"adr3","networkSymbol":"TEST"}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"adr3","networkSymbol":"TEST","metadata":{"label":"Petr_adr2_v1"}}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"adr3","networkSymbol":"TEST"}'

	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"adr4","networkSymbol":"TEST"}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"adr4","networkSymbol":"TEST","metadata":{"label":"Petr_adr2_v0"}}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"adr4","networkSymbol":"TEST"}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"adr4","networkSymbol":"TEST","metadata":{"label":"Petr_adr2_v1"}}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"adr4","networkSymbol":"TEST"}'
fi


if false; then
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"notThere","networkSymbol":"TEST"}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"deleteMe2","networkSymbol":"TEST"}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"deleteMe2","networkSymbol":"TEST","metadata":{"label":"Petr_deleteMeLabel"}}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbdelete --db-params='{"address":"deleteMe2","networkSymbol":"TEST"}'
	#Running @trezor/connect CLI with args {
	#  _: [ 'method', 'db-params' ],
	#  udp: true,
	#  autoconnect: true,
	#  method: 'dbchange',
	#  db-params: '{"address":"deleteMe2","networkSymbol":"TEST","delete":true}'
	#}
	#
	#Authenticity verified: false — database not updated
	#all the rest is broken

	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"deleteMe2","networkSymbol":"TEST"}'
		#ISSUE Authenticity verified: false
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"adr2","networkSymbol":"TEST"}'
		#ISSUE Authenticity verified: false
		#database seems to be broken now

	#ADD: reset_root -- this can mess up versioning -- > increase version
fi



if true; then
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbdisplay --db-params='{"address":"deleteMe3","networkSymbol":"TEST"}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"deleteMe3","networkSymbol":"TEST","metadata":{"label":"Petr_deleteMe3Label"}}'

	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbdisplay --db-params='{"address":"deleteMe3","networkSymbol":"TEST"}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange   --db-params='{"address":"deleteMe3","networkSymbol":"TEST","delete":true}'

	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbdisplay --db-params='{"address":"deleteMe3","networkSymbol":"TEST"}'

	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"deleteMe3","networkSymbol":"TEST"}'

	# Deleting again must FAIL fast ("nothing to delete") rather than write a second leaf.
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbdelete --db-params='{"address":"deleteMe3","networkSymbol":"TEST"}'
	# A tombstone check: dbchange with metadata:{} is an UPDATE, so adr1 must still be a
	# MEMBER afterwards -- it must NOT look deleted.
    yarn workspace @trezor/connect-cli udp --autoconnect --method=dbdisplay --db-params='{"address":"deleteMe3","networkSymbol":"TEST"}'
    
fi


( cd ~/GitHub/trezor-firmware && pytest tests/device_tests/misc/test_ward.py -q 2>&1 |tee pytest_ward.log )
( cd ~/GitHub/trezor-firmware && pytest tests/device_tests/misc/test_ward_batch.py -q 2>&1 |tee pytest_ward_batch.log )
( cd ~/GitHub/trezor-firmware && pytest tests/device_tests/misc/test_ward_sync.py -q 2>&1 |tee pytest_ward_sync.log )
( cd ~/GitHub/trezor-firmware && pytest tests/device_tests/misc/test_display_address.py -q 2>&1 |tee display_address.log )

( cd ~/GitHub/trezor-firmware && python3 -m pytest tests/device_tests/misc/test_ward_mpt.py -q -rxX )
( cd ~/GitHub/trezor-firmware && python3 -m pytest python/tests/test_ward_crypto.py -q )

