find . $1 \
 -not -path "**/node_modules/*" \
 -not -path "**/build/*" \
 -not -path "**/lib/*" \
 -not -path "**/libDev/*" \
 \( -name "*.ts" -or -name "*.tsx" \) \
 -not -name "messages.ts" \
 -not -name "*.test.*" \
 -exec grep -nH --color=auto $2 {} ';' -quit;
