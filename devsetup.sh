#!/bin/env bash

curl https://mise.run | sh

# Check if ~/.local/bin is in PATH and add it if not
if ! echo "$PATH" | grep -q "$HOME/.local/bin"; then
    export PATH="$HOME/.local/bin:$PATH"
fi

~/.local/bin/mise trust
~/.local/bin/mise install
cp .env.example .env
