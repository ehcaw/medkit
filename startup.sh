#!/bin/bash
curl -sSL https://install.helix-db.com | bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc"
source ~/.zshrc

helix init --path helix-medkit
cd helix-medkit
helix deploy -p .