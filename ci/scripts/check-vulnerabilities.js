/* eslint-disable */
var stdin = process.openStdin();

var data = "";

stdin.on('data', function(chunk) {
  data += chunk;
});

stdin.on('end', function() {
  console.log(data);
  const index = data.indexOf("] Total");
  if (data[index-1]  === '0') return process.exit(0);
  return process.exit(1);
});

process.on('exit', function(code) {
    return console.log(`Security check exited with code ${code}`);
});
