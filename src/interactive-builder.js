const readline = require("readline")
const fs = require("fs")
const path = require("path")
const { spawn, spawnSync } = require("child_process")
const { ProjectAnalyzer } = require("./agent/project-analyzer")
const { SmartAgent } = require("./agent/smart-agent")

class InteractiveProjectBuilder {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    this.analyzer = new ProjectAnalyzer()
    this.agent = new SmartAgent()
    this.projectConfig = {
      name: "",
      type: "",
      framework: "",
      features: [],
      dependencies: [],
      structure: {},
    }
  }

  async start() {
    console.log("\n🚀 Welcome to BetterPack Interactive Project Builder!")
    console.log("I'll help you create and manage your project using natural language.\n")

    await this.gatherProjectInfo()
    await this.analyzeAndSetup()
    await this.enterInteractiveMode()
  }

  async gatherProjectInfo() {
    console.log("Let's start by understanding what you want to build...\n")

    this.projectConfig.name = await this.ask("What's your project name? ")

    const projectType = await this.ask("What type of project? (web app, api, cli tool, library, mobile app, etc.) ")
    this.projectConfig.type = projectType.toLowerCase()

    const description = await this.ask("Describe your project in a few sentences: ")
    this.projectConfig.description = description

    // AI-powered framework recommendation
    const recommendation = await this.getFrameworkRecommendation(projectType, description)
    console.log(`\n🤖 Based on your description, I recommend: ${recommendation.framework}`)
    console.log(`Reason: ${recommendation.reason}\n`)

    const useRecommended = await this.ask(`Use ${recommendation.framework}? (y/n) `)
    if (useRecommended.toLowerCase().startsWith("y")) {
      this.projectConfig.framework = recommendation.framework
    } else {
      this.projectConfig.framework = await this.ask("Which framework would you prefer? ")
    }

    const features = await this.ask("What features do you need? (authentication, database, api, testing, etc.) ")
    this.projectConfig.features = features.split(",").map((f) => f.trim())
  }

  async getFrameworkRecommendation(projectType, description) {
    const recommendations = {
      "web app": {
        framework: "Next.js",
        reason: "Full-stack React framework with SSR, API routes, and excellent developer experience",
      },
      api: {
        framework: "Express.js",
        reason: "Lightweight and flexible Node.js framework perfect for REST APIs",
      },
      "cli tool": {
        framework: "Node.js with Commander.js",
        reason: "Native Node.js with command-line parsing library for robust CLI tools",
      },
      library: {
        framework: "TypeScript with Rollup",
        reason: "Type-safe development with optimized bundling for library distribution",
      },
      "mobile app": {
        framework: "React Native",
        reason: "Cross-platform mobile development with React",
      },
    }

    // Simple keyword-based enhancement
    if (description.includes("react") || description.includes("component")) {
      return {
        framework: "Next.js",
        reason: "React-based framework detected from description",
      }
    }

    if (description.includes("vue")) {
      return {
        framework: "Nuxt.js",
        reason: "Vue.js framework detected from description",
      }
    }

    return (
      recommendations[projectType] || {
        framework: "Next.js",
        reason: "Versatile full-stack framework suitable for most projects",
      }
    )
  }

  async analyzeAndSetup() {
    console.log("\n📊 Analyzing project requirements...")

    // Generate project structure
    const structure = this.generateProjectStructure()
    this.projectConfig.structure = structure

    // Determine dependencies
    const dependencies = this.determineDependencies()
    this.projectConfig.dependencies = dependencies

    console.log("\n📋 Project Plan:")
    console.log(`Name: ${this.projectConfig.name}`)
    console.log(`Framework: ${this.projectConfig.framework}`)
    console.log(`Features: ${this.projectConfig.features.join(", ")}`)
    console.log(`Dependencies: ${dependencies.join(", ")}`)

    const proceed = await this.ask("\nProceed with project creation? (y/n) ")
    if (proceed.toLowerCase().startsWith("y")) {
      await this.createProject()
    }
  }

  generateProjectStructure() {
    const framework = this.projectConfig.framework.toLowerCase()

    if (framework.includes("next")) {
      return {
        "app/": "Next.js app directory",
        "components/": "React components",
        "lib/": "Utility functions",
        "public/": "Static assets",
        "styles/": "CSS and styling files",
      }
    } else if (framework.includes("express")) {
      return {
        "src/": "Source code",
        "routes/": "API routes",
        "middleware/": "Express middleware",
        "models/": "Data models",
        "config/": "Configuration files",
      }
    } else {
      return {
        "src/": "Source code",
        "dist/": "Build output",
        "tests/": "Test files",
        "docs/": "Documentation",
      }
    }
  }

  determineDependencies() {
    const deps = []
    const framework = this.projectConfig.framework.toLowerCase()

    // Framework dependencies
    if (framework.includes("next")) {
      deps.push("next", "react", "react-dom")
    } else if (framework.includes("express")) {
      deps.push("express", "cors", "helmet")
    } else if (framework.includes("commander")) {
      deps.push("commander", "chalk", "inquirer")
    }

    // Feature-based dependencies
    this.projectConfig.features.forEach((feature) => {
      const f = feature.toLowerCase()
      if (f.includes("auth")) deps.push("jsonwebtoken", "bcrypt")
      if (f.includes("database")) deps.push("mongoose", "prisma")
      if (f.includes("test")) deps.push("jest", "supertest")
      if (f.includes("typescript")) deps.push("typescript", "@types/node")
    })

    return [...new Set(deps)] // Remove duplicates
  }

  async createProject() {
    console.log("\n🏗️  Creating project structure...")

    const projectPath = path.join(process.cwd(), this.projectConfig.name)

    // Create project directory
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true })
    }

    process.chdir(projectPath)

    // Initialize package.json
    const packageJson = {
      name: this.projectConfig.name,
      version: "1.0.0",
      description: this.projectConfig.description,
      main: "index.js",
      scripts: this.generateScripts(),
      dependencies: {},
      devDependencies: {},
    }

    fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2))

    // Create directory structure
    Object.keys(this.projectConfig.structure).forEach((dir) => {
      const dirPath = path.join(projectPath, dir)
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }
    })

    // Install dependencies
    if (this.projectConfig.dependencies.length > 0) {
      console.log("📦 Installing dependencies...")
      const installCmd = this.detectPackageManager()
      const result = spawnSync(installCmd, ["add", ...this.projectConfig.dependencies], {
        stdio: "inherit",
        shell: true,
      })

      if (result.status !== 0) {
        console.error("❌ Failed to install dependencies")
      } else {
        console.log("✅ Dependencies installed successfully")
      }
    }

    // Generate initial files
    await this.generateInitialFiles(projectPath)

    console.log(`\n🎉 Project "${this.projectConfig.name}" created successfully!`)
    console.log(`📁 Location: ${projectPath}`)
  }

  generateScripts() {
    const framework = this.projectConfig.framework.toLowerCase()

    if (framework.includes("next")) {
      return {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      }
    } else if (framework.includes("express")) {
      return {
        start: "node src/index.js",
        dev: "nodemon src/index.js",
        test: "jest",
      }
    } else {
      return {
        start: "node src/index.js",
        build: "npm run compile",
        test: "jest",
      }
    }
  }

  async generateInitialFiles(projectPath) {
    const framework = this.projectConfig.framework.toLowerCase()

    if (framework.includes("next")) {
      // Generate Next.js files
      const appPage = `export default function Home() {
  return (
    <main>
      <h1>Welcome to ${this.projectConfig.name}</h1>
      <p>${this.projectConfig.description}</p>
    </main>
  );
}`
      fs.writeFileSync(path.join(projectPath, "app/page.js"), appPage)

      const layout = `export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`
      fs.writeFileSync(path.join(projectPath, "app/layout.js"), layout)
    } else if (framework.includes("express")) {
      // Generate Express.js files
      const serverCode = `const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to ${this.projectConfig.name}',
    description: '${this.projectConfig.description}'
  });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`
      fs.writeFileSync(path.join(projectPath, "src/index.js"), serverCode)
    }

    // Generate README
    const readme = `# ${this.projectConfig.name}

${this.projectConfig.description}

## Framework
${this.projectConfig.framework}

## Features
${this.projectConfig.features.map((f) => `- ${f}`).join("\n")}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Generated with BetterPack Interactive Project Builder 🚀
`
    fs.writeFileSync(path.join(projectPath, "README.md"), readme)
  }

  async enterInteractiveMode() {
    console.log("\n💬 Entering interactive mode. You can now use natural language to modify your project.")
    console.log("Examples:")
    console.log('  - "add authentication to my app"')
    console.log('  - "create a user dashboard component"')
    console.log('  - "add a database connection"')
    console.log('  - "help" for more commands')
    console.log('  - "exit" to quit\n')

    while (true) {
      const input = await this.ask("🤖 What would you like to do? ")

      if (input.toLowerCase() === "exit") {
        console.log("👋 Goodbye! Happy coding!")
        break
      }

      if (input.toLowerCase() === "help") {
        this.showHelp()
        continue
      }

      await this.processNaturalLanguageCommand(input)
    }
  }

  async processNaturalLanguageCommand(input) {
    console.log("🤔 Processing your request...")

    // Simple keyword-based processing (can be enhanced with actual AI)
    const lowerInput = input.toLowerCase()

    if (lowerInput.includes("add") && lowerInput.includes("component")) {
      await this.handleAddComponent(input)
    } else if (lowerInput.includes("add") && lowerInput.includes("auth")) {
      await this.handleAddAuthentication()
    } else if (lowerInput.includes("add") && lowerInput.includes("database")) {
      await this.handleAddDatabase()
    } else if (lowerInput.includes("analyze") || lowerInput.includes("status")) {
      await this.handleAnalyzeProject()
    } else if (lowerInput.includes("install") || lowerInput.includes("dependency")) {
      await this.handleInstallDependency(input)
    } else {
      console.log("🤷 I'm not sure how to handle that request yet.")
      console.log('Try being more specific or use "help" to see available commands.')
    }
  }

  async handleAddComponent(input) {
    const componentName = await this.ask("What should the component be called? ")
    const componentType = await this.ask("What type of component? (page, form, button, etc.) ")

    console.log(`🔧 Creating ${componentType} component: ${componentName}`)

    // Generate component based on framework
    const framework = this.projectConfig.framework.toLowerCase()
    let componentCode = ""

    if (framework.includes("next") || framework.includes("react")) {
      componentCode = `export default function ${componentName}() {
  return (
    <div>
      <h2>${componentName}</h2>
      <p>This is a ${componentType} component.</p>
    </div>
  );
}`

      const fileName = `${componentName.toLowerCase()}.js`
      const filePath = path.join("components", fileName)

      if (!fs.existsSync("components")) {
        fs.mkdirSync("components", { recursive: true })
      }

      fs.writeFileSync(filePath, componentCode)
      console.log(`✅ Component created: ${filePath}`)
    }
  }

  async handleAddAuthentication() {
    console.log("🔐 Adding authentication system...")

    const authType = await this.ask("What type of auth? (jwt, oauth, simple) ")

    // Install auth dependencies
    const authDeps = ["jsonwebtoken", "bcrypt"]
    console.log("📦 Installing authentication dependencies...")

    const installCmd = this.detectPackageManager()
    spawnSync(installCmd, ["add", ...authDeps], { stdio: "inherit", shell: true })

    // Generate auth files (simplified example)
    const authMiddleware = `const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.sendStatus(401);
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };`

    if (!fs.existsSync("middleware")) {
      fs.mkdirSync("middleware", { recursive: true })
    }

    fs.writeFileSync("middleware/auth.js", authMiddleware)
    console.log("✅ Authentication system added!")
    console.log("📝 Don't forget to set JWT_SECRET in your environment variables.")
  }

  async handleAddDatabase() {
    console.log("🗄️  Adding database connection...")

    const dbType = await this.ask("What database? (mongodb, postgresql, mysql, sqlite) ")

    let dbDeps = []
    if (dbType.includes("mongo")) {
      dbDeps = ["mongoose"]
    } else if (dbType.includes("postgres")) {
      dbDeps = ["pg"]
    } else if (dbType.includes("mysql")) {
      dbDeps = ["mysql2"]
    } else if (dbType.includes("sqlite")) {
      dbDeps = ["sqlite3"]
    }

    console.log("📦 Installing database dependencies...")
    const installCmd = this.detectPackageManager()
    spawnSync(installCmd, ["add", ...dbDeps], { stdio: "inherit", shell: true })

    console.log("✅ Database dependencies installed!")
    console.log("📝 Configure your database connection in the config folder.")
  }

  async handleAnalyzeProject() {
    console.log("📊 Analyzing current project...")

    try {
      const analysis = await this.analyzer.analyzeProject(process.cwd())

      console.log("\n📈 Project Analysis Results:")
      console.log(`Health Score: ${analysis.healthScore}/100`)
      console.log(`Dependencies: ${analysis.dependencies.length} packages`)
      console.log(`Issues Found: ${analysis.issues.length}`)

      if (analysis.issues.length > 0) {
        console.log("\n⚠️  Issues:")
        analysis.issues.forEach((issue) => {
          console.log(`  - ${issue.type}: ${issue.message}`)
        })
      }

      if (analysis.recommendations.length > 0) {
        console.log("\n💡 Recommendations:")
        analysis.recommendations.forEach((rec) => {
          console.log(`  - ${rec.action}: ${rec.reason}`)
        })
      }
    } catch (error) {
      console.error("❌ Failed to analyze project:", error.message)
    }
  }

  async handleInstallDependency(input) {
    const packageName = await this.ask("What package would you like to install? ")

    console.log(`📦 Installing ${packageName}...`)
    const installCmd = this.detectPackageManager()
    const result = spawnSync(installCmd, ["add", packageName], { stdio: "inherit", shell: true })

    if (result.status === 0) {
      console.log(`✅ ${packageName} installed successfully!`)
    } else {
      console.log(`❌ Failed to install ${packageName}`)
    }
  }

  detectPackageManager() {
    if (fs.existsSync("pnpm-lock.yaml")) return "pnpm"
    if (fs.existsSync("yarn.lock")) return "yarn"
    if (fs.existsSync("package-lock.json")) return "npm"
    return "npm" // default
  }

  showHelp() {
    console.log("\n📚 Available Commands:")
    console.log("  Natural Language Examples:")
    console.log('    - "add a login component"')
    console.log('    - "add authentication to my app"')
    console.log('    - "add database connection"')
    console.log('    - "install lodash package"')
    console.log('    - "analyze my project"')
    console.log('    - "create a user dashboard"')
    console.log("\n  Direct Commands:")
    console.log("    - help    - Show this help message")
    console.log("    - exit    - Exit interactive mode")
    console.log("    - status  - Show project analysis")
  }

  ask(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim())
      })
    })
  }

  close() {
    this.rl.close()
  }
}

module.exports = { InteractiveProjectBuilder }
