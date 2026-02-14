#!/bin/bash

set -e

# Constants ============================================================================================================

ETC_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/etc"

G="\033[0;32m"
E="\033[0;31m"
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
sudo apt-get install python3 pythin3-smbus curl -y

# Runtime ==============================================================================================================

echo -e "${Y}Installing main runtime...${NC}"

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
\. "$HOME/.nvm/nvm.sh"
nvm install --lts

echo -e "${R}Install complete. Reboot the device for changes to take effect.${NC}"

