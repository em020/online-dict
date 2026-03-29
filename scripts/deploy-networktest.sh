#!/bin/sh
set -eu

SRC_DIR="./dist/networktest"
DEST_DIR="/Users/yiminsun/Library/Eudb_en"

FILES="
index.js
index.css
client.js
dict.js
eudic_config.json
"

mkdir -p "$DEST_DIR"

for file in $FILES
do
  cp "$SRC_DIR/$file" "$DEST_DIR/$file"
done

printf 'Deployed networktest assets to %s\n' "$DEST_DIR"
