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
	sleep 5
fi

yarn workspace @trezor/connect-cli udp --autoconnect
# NOTE: dbclear / AuthDbClearRoot was removed — AuthDB now has no clear-root RPC by
# design (the device's global counter is authoritative and monotonic). The device's
# AuthDB state is reset ONLY by wiping the emulator flash (the erased `./core/emu.py -e`
# above). If the emulator is not truly erased, the device keeps its counter while the
# host DB (wiped on line 12) starts at 0, and dbchange fails with
# "new_counter must equal current global counter + 1". Ensure the emulator really erased.


yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"first","networkSymbol":"TEST"}'
yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"second","networkSymbol":"TEST","metadata":{"label":"Adr1_v0"}}'
yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"third","networkSymbol":"TEST"}'
pkill -f core/emu.py; sleep 1


# The device's AuthDB tree must match the freshly-wiped host DB. Since dbclear was
# removed, the ONLY reset is a true emulator flash erase (above). If the emulator keeps
# a stale tree while the host DB starts empty, every insert is built as an INIT (empty
# proof) against a non-empty device, or the global counters diverge -- both are rejected.
# If you cannot reliably erase the emulator, delete its flash/profile before this run.

if true; then
	for i in `seq 1 1 16`; do
		for j in `seq 1 1 2`; do
			echo Stage $i, run $j  
			eval yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params=\''{"address":"next'${i}'","networkSymbol":"TEST","metadata":{"label":"'Petr_next${i}_v${j}'"}}'\'
			echo "===== Finished $i, run $j ====="
		done
	done
fi

if true; then
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"adr1","networkSymbol":"TEST"}'
		# ISSUE: non-membership : not verified
		# "No Merkle root stored on device"  --> for each element,  Authenticity verified (non-membership): true
		# we should call reset_root

	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"adr1","networkSymbol":"TEST","metadata":{"label":"Petr_adr1_v0"}}'


	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"deleteMe","networkSymbol":"TEST"}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"deleteMe","networkSymbol":"TEST","metadata":{"label":"Petr_deleteMeLabel"}}'

	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"deleteMe","networkSymbol":"TEST"}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"adr1","networkSymbol":"TEST"}'
	#Authenticity verified: true

	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange   --db-params='{"address":"deleteMe","networkSymbol":"TEST","metadata":{}}'
	#Authenticity verified: true

	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"deleteMe","networkSymbol":"TEST"}'
	#Authenticity verified: true
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"adr1","networkSymbol":"TEST"}'


	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"adr1","networkSymbol":"TEST"}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"adr1","networkSymbol":"TEST","metadata":{"label":"Petr_adr1_v1"}}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dblookup --db-params='{"address":"adr1","networkSymbol":"TEST"}'
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"adr1","networkSymbol":"TEST","metadata":{"label":"Petr_adr1_v2"}}'

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
	yarn workspace @trezor/connect-cli udp --autoconnect --method=dbchange --db-params='{"address":"deleteMe2","networkSymbol":"TEST","metadata":{}}'
	#Running @trezor/connect CLI with args {
	#  _: [ 'method', 'db-params' ],
	#  udp: true,
	#  autoconnect: true,
	#  method: 'dbchange',
	#  db-params: '{"address":"deleteMe2","networkSymbol":"TEST","metadata":{}}'
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
