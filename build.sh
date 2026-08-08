#!/usr/bin/env bash
# Cross-platform build wrapper: delegate to the Node build script so the repo
# works in Windows PowerShell, Git Bash, WSL, and hosted environments.
set -e
cd "$(dirname "$0")"
node build.js "$@"
