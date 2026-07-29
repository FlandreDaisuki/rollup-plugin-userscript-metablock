#!/usr/bin/env bash

set -euo pipefail

license_file=${1:-LICENSE}
copyright_holder=${COPYRIGHT_HOLDER:-FlandreDaisuki}
copyright_email=${COPYRIGHT_EMAIL:-github@flandre.tw}
current_year=${CURRENT_YEAR:-$(date -u +%Y)}

if [[ ! -f $license_file ]]; then
  echo "License file not found: $license_file" >&2
  exit 1
fi

if [[ ! $current_year =~ ^[0-9]{4}$ ]]; then
  echo "CURRENT_YEAR must be a four-digit year: $current_year" >&2
  exit 1
fi

copyright_pattern='^Copyright \(c\) ([0-9]{4})(-[0-9]{4})? '
start_year=

while IFS= read -r line; do
  if [[ $line =~ $copyright_pattern ]]; then
    start_year=${BASH_REMATCH[1]}
    break
  fi
done < "$license_file"

if [[ -z $start_year ]]; then
  echo "No copyright line found in $license_file" >&2
  exit 1
fi

if (( 10#$current_year < 10#$start_year )); then
  echo "Current year $current_year is earlier than start year $start_year" >&2
  exit 1
fi

year_range=$start_year
if [[ $current_year != "$start_year" ]]; then
  year_range="${start_year}-${current_year}"
fi

replacement="Copyright (c) ${year_range} ${copyright_holder} <${copyright_email}>"
escaped_replacement=${replacement//\\/\\\\}
escaped_replacement=${escaped_replacement//&/\\&}
escaped_replacement=${escaped_replacement//|/\\|}

sed -E -i \
  "0,/^Copyright \\(c\\) [0-9]{4}(-[0-9]{4})? /s|^Copyright \\(c\\) .*$|${escaped_replacement}|" \
  "$license_file"
