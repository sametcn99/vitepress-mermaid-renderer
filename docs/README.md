# Test Project for VitePress Mermaid Renderer

This is a test project that demonstrates the functionality of the vitepress-mermaid-renderer package.

## Quick Start

### Windows

```bash
# Run the PowerShell installation script
.\install.ps1
```

### Linux/macOS

```bash
# Make the script executable
chmod +x install.sh

# Run the installation script
./install.sh
```

## Manual Setup

If you prefer to set up manually:

```bash
# Clean up (if needed)
rm -rf node_modules .vitepress/cache dist

# Install dependencies
bun install

# Install the local plugin
bun add ../vitepress-mermaid-renderer-1.0.13.tgz

# Start development server
bun run docs:dev
```
