#!/bin/bash
# Wrapper script to run chitchat from its data directory
set -e

# Get the snap directory
SNAP_DIR="$(dirname "$(dirname "$(readlink -f "$0")")")"

# Ensure data directory exists and cd to it
if [ -n "$SNAP_USER_COMMON" ]; then
  mkdir -p "$SNAP_USER_COMMON"
  cd "$SNAP_USER_COMMON"
fi

# Run the actual binary
exec "$SNAP_DIR/bin/chitchat" "$@"
