#!/bin/bash

set -e

# Constants ============================================================================================================

ETC_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/etc"

G="\033[0;32m"
R="\033[0;31m"
Y="\033[1;33m"
NC="\033[0m" # No Color

# Dependencies =========================================================================================================

echo -e "${R}This script will begin the installation process shortly.${NC}"
echo -e "${R}Due to the nature of this script, you will be required to enter"
echo -e "${R}your sudo password in order to install certain dependencies${NC}"

sudo -v

if [ ! -d "$ETC_DIR" ]; then
    mkdir -p "$ETC_DIR"
fi

echo -e "${Y}Installing core dependencies...${NC}"
sudo apt-get update
sudo apt-get install python3 python3-smbus curl -y

# Runtime ==============================================================================================================

echo -e "${Y}Installing main runtime...${NC}"

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install --lts

# Port binding =========================================================================================================

# This step is here mostly for development purposes so that the app can be ran
# and tested on the correct ports.

echo -e "${Y}Enabling privileged port binding for NodeJS${NC}"

node_binary="$(readlink -f "$(command -v node)")"
sudo setcap 'cap_net_bind_service=+ep' "$node_binary"

echo -e "${G}Granted access to priviliged port binding (1-1023) to the Node runtime.${NC}"

# Finished =============================================================================================================

echo -e "${R}Install complete. Reboot the device for changes to take effect.${NC}"


