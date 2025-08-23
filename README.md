# BetterPack - A Universal Node.js Package Manager CLI with AI-Powered Project Management

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/involvex/betterpack)](https://github.com/involvex/betterpack/releases/latest)
[![npm version](https://img.shields.io/npm/v/betterpack)](https://www.npmjs.com/package/betterpack)

BetterPack (`bpack`) is a powerful command-line interface (CLI) tool that combines universal package management with AI-powered project automation. It automatically detects your package manager (`npm`, `yarn`, `pnpm`, or `bun`) and provides intelligent project building, bundling, and management capabilities.

[View on npm](https://www.npmjs.com/package/betterpack) | [Documentation](https://involvex.github.io/betterpack/)

## 🚀 Key Features

- **Universal Package Management**: Works with npm, yarn, pnpm, and bun
- **AI-Powered Project Builder**: Interactive project creation with natural language
- **Automated Agent Mode**: Intelligent project monitoring and management
- **Advanced Bundling**: Create executables, installers, and archives
- **Web Dashboard**: Real-time monitoring with dark mode support
- **Smart Dependency Management**: Automatic framework detection and setup

## Support the Project

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/involvex)

## Installation

\`\`\`bash
npm i betterpack -g
\`\`\`

## Quick Start

\`\`\`bash
# Universal package management
bpack install
bpack add express

# <CHANGE> Added new AI-powered features
# Interactive project creation
bpack create

# Start automated agent mode
bpack agent start

# Bundle your project
bpack bundle --format exe

# Launch web dashboard
bpack dashboard
\`\`\`

... existing code ...

## 🤖 AI-Powered Features

### Interactive Project Builder
Create projects through natural language conversations:

\`\`\`bash
bpack create
# or
bpack build-project
\`\`\`

The AI will guide you through:
- Project type selection and framework recommendations
- Dependency installation and configuration
- Directory structure setup
- Feature addition (auth, database, components)
- Ongoing project modifications

### Automated Agent Mode
Intelligent project monitoring and management:

\`\`\`bash
bpack agent start    # Start the automated agent
bpack agent stop     # Stop the agent
bpack agent status   # Check agent status
bpack dashboard      # Launch web interface
\`\`\`

Features:
- **Project Health Monitoring**: Continuous dependency and security checks
- **Smart Recommendations**: AI-powered suggestions for improvements
- **Automated Tasks**: Dependency updates, security patches, optimization
- **Performance Tracking**: Real-time metrics and alerts
- **Web Dashboard**: Modern interface with dark mode support

### AI Chat Integration
Built-in AI assistance with multiple providers:

\`\`\`bash
bpack gemini         # Chat with Google Gemini
bpack chat           # Interactive AI assistance
\`\`\`

Supports:
- Google Gemini (free tier available)
- OpenAI GPT models
- Local models (TinyLlama, etc.)

## 📦 Advanced Bundling

Create various distribution formats:

\`\`\`bash
# Single JavaScript bundle
bpack bundle --format js --output dist/app.js

# Executable files
bpack bundle --format exe --output dist/myapp.exe

# Archive formats
bpack bundle --format zip --output dist/project.zip
bpack bundle --format tar --output dist/project.tar.gz

# Installers
bpack bundle --format msix --output dist/installer.msix  # Windows
bpack bundle --format sh --output dist/install.sh       # Linux/macOS
\`\`\`

Options:
- `--include`: Specify files to include
- `--exclude`: Specify files to exclude  
- `--minify`: Minify the output
- `--target`: Target platform (node, browser, electron)

... existing code ...

## 🌐 Web Dashboard

Launch the modern web interface:

\`\`\`bash
bpack dashboard
\`\`\`

Features:
- **Real-time Monitoring**: Project health, performance metrics
- **Agent Control**: Start/stop automation, configure settings
- **Task Management**: View execution history and logs
- **AI Model Configuration**: Switch between providers and models
- **Dark/Light Mode**: Responsive design with theme switching
- **Performance Charts**: Visual analytics and trends

## Environment Variables

Configure AI providers:

\`\`\`bash
# Google Gemini (recommended - free tier available)
GOOGLE_API_KEY=your_gemini_api_key

# Optional: Other AI providers
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Agent configuration
JWT_SECRET=your_jwt_secret_for_auth
PORT=3000
\`\`\`

... existing code ...

## 📚 Documentation

Visit our [comprehensive documentation](https://involvex.github.io/betterpack/) for:
- Detailed API reference
- Advanced configuration options
- AI model setup guides
- Bundling tutorials
- Contributing guidelines

... existing code ...
\`\`\`

```html file="" isHidden
