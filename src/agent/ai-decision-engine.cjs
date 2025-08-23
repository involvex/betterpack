const fs = require("fs")
const path = require("path")

class AIDecisionEngine {
  constructor(options = {}) {
    this.options = {
      learningEnabled: options.learningEnabled !== false,
      riskTolerance: options.riskTolerance || "medium", // low, medium, high
      contextWindow: options.contextWindow || 10, // Number of past decisions to consider
      ...options,
    }

    this.decisionHistory = []
    this.learningData = this.loadLearningData()
    this.ruleEngine = new ProjectRuleEngine()
  }

  async makeDecision(analysisData, context = {}) {
    console.log("[AI] Analyzing project state and making decisions...")

    const decision = {
      timestamp: new Date(),
      context: context,
      analysis: this.summarizeAnalysis(analysisData),
      recommendations: [],
      reasoning: [],
      confidence: 0,
      riskLevel: "unknown",
    }

    // Apply rule-based reasoning
    const ruleBasedDecisions = this.ruleEngine.evaluate(analysisData, context)
    decision.recommendations.push(...ruleBasedDecisions)

    // Apply pattern-based learning
    const learnedDecisions = this.applyLearning(analysisData, context)
    decision.recommendations.push(...learnedDecisions)

    // Prioritize and filter recommendations
    decision.recommendations = this.prioritizeRecommendations(decision.recommendations, analysisData)

    // Calculate confidence and risk
    decision.confidence = this.calculateConfidence(decision.recommendations, analysisData)
    decision.riskLevel = this.assessRisk(decision.recommendations, analysisData)

    // Generate reasoning explanations
    decision.reasoning = this.generateReasoning(decision.recommendations, analysisData)

    // Store decision for learning
    this.decisionHistory.push(decision)
    if (this.options.learningEnabled) {
      this.updateLearningData(decision)
    }

    return decision
  }

  summarizeAnalysis(analysisData) {
    return {
      healthScore: analysisData.health?.score || 0,
      healthStatus: analysisData.health?.status || "unknown",
      issueCount: analysisData.issues?.length || 0,
      criticalIssues: analysisData.issues?.filter((i) => i.severity === "high").length || 0,
      dependencyCount: analysisData.dependencies?.total || 0,
      outdatedCount: analysisData.dependencies?.outdated?.length || 0,
      vulnerableCount: analysisData.dependencies?.vulnerable?.length || 0,
      projectType: analysisData.structure?.projectType || "unknown",
      frameworks: analysisData.structure?.frameworks || [],
    }
  }

  prioritizeRecommendations(recommendations, analysisData) {
    // Score each recommendation based on impact, urgency, and risk
    const scoredRecommendations = recommendations.map((rec) => {
      const score = this.scoreRecommendation(rec, analysisData)
      return { ...rec, priority: score.priority, score: score.total }
    })

    // Sort by score (highest first) and filter based on risk tolerance
    return scoredRecommendations
      .sort((a, b) => b.score - a.score)
      .filter((rec) => this.isAcceptableRisk(rec, analysisData))
      .slice(0, 10) // Limit to top 10 recommendations
  }

  scoreRecommendation(recommendation, analysisData) {
    let impact = 0
    let urgency = 0
    let feasibility = 0
    let risk = 0

    // Score based on recommendation type
    switch (recommendation.type) {
      case "security":
        impact = 10
        urgency = 10
        feasibility = 8
        risk = 2
        break
      case "performance":
        impact = 7
        urgency = 5
        feasibility = 6
        risk = 3
        break
      case "maintenance":
        impact = 5
        urgency = 3
        feasibility = 8
        risk = 2
        break
      case "workflow":
        impact = 4
        urgency = 2
        feasibility = 9
        risk = 1
        break
      default:
        impact = 3
        urgency = 3
        feasibility = 5
        risk = 5
    }

    // Adjust based on project health
    if (analysisData.health?.score < 50) {
      urgency += 3
      impact += 2
    }

    // Adjust based on issue severity
    if (recommendation.severity === "high") {
      urgency += 4
      impact += 3
    } else if (recommendation.severity === "medium") {
      urgency += 2
      impact += 1
    }

    const total = impact * 0.4 + urgency * 0.3 + feasibility * 0.2 - risk * 0.1

    let priority = "low"
    if (total >= 8) priority = "critical"
    else if (total >= 6) priority = "high"
    else if (total >= 4) priority = "medium"

    return { impact, urgency, feasibility, risk, total, priority }
  }

  isAcceptableRisk(recommendation, analysisData) {
    const riskLevel = recommendation.risk || this.assessRecommendationRisk(recommendation)

    switch (this.options.riskTolerance) {
      case "low":
        return riskLevel <= 2
      case "medium":
        return riskLevel <= 5
      case "high":
        return riskLevel <= 8
      default:
        return true
    }
  }

  assessRecommendationRisk(recommendation) {
    // Assess risk based on action type and project state
    const action = recommendation.action || ""

    if (action.includes("remove") || action.includes("delete")) return 8
    if (action.includes("update") && action.includes("major")) return 7
    if (action.includes("install") && recommendation.type === "security") return 3
    if (action.includes("audit --fix")) return 4
    if (action.includes("update")) return 5
    if (action.includes("install")) return 3

    return 2 // Default low risk
  }

  calculateConfidence(recommendations, analysisData) {
    if (recommendations.length === 0) return 0

    let totalConfidence = 0
    let factors = 0

    // Base confidence on data quality
    if (analysisData.structure?.hasPackageJson) {
      totalConfidence += 20
      factors++
    }

    if (analysisData.structure?.hasLockfile) {
      totalConfidence += 15
      factors++
    }

    // Confidence based on issue clarity
    const clearIssues = analysisData.issues?.filter((i) => i.fix).length || 0
    if (clearIssues > 0) {
      totalConfidence += Math.min(30, clearIssues * 5)
      factors++
    }

    // Confidence based on learning history
    const similarDecisions = this.findSimilarDecisions(analysisData)
    if (similarDecisions.length > 0) {
      const successRate = similarDecisions.filter((d) => d.outcome === "success").length / similarDecisions.length
      totalConfidence += successRate * 25
      factors++
    }

    // Confidence based on recommendation consensus
    const consensusScore = this.calculateConsensus(recommendations)
    totalConfidence += consensusScore * 10
    factors++

    return factors > 0 ? Math.min(100, totalConfidence / factors) : 50
  }

  assessRisk(recommendations, analysisData) {
    const riskScores = recommendations.map((rec) => this.assessRecommendationRisk(rec))
    const avgRisk = riskScores.reduce((sum, risk) => sum + risk, 0) / riskScores.length

    if (avgRisk >= 7) return "high"
    if (avgRisk >= 4) return "medium"
    return "low"
  }

  generateReasoning(recommendations, analysisData) {
    const reasoning = []

    // Health-based reasoning
    if (analysisData.health?.score < 60) {
      reasoning.push({
        factor: "health",
        explanation: `Project health score is ${analysisData.health.score}/100, indicating need for immediate attention`,
        impact: "high",
      })
    }

    // Security-based reasoning
    const securityRecs = recommendations.filter((r) => r.type === "security")
    if (securityRecs.length > 0) {
      reasoning.push({
        factor: "security",
        explanation: `${securityRecs.length} security-related recommendations require immediate action`,
        impact: "critical",
      })
    }

    // Dependency-based reasoning
    if (analysisData.dependencies?.outdated?.length > 5) {
      reasoning.push({
        factor: "maintenance",
        explanation: `${analysisData.dependencies.outdated.length} outdated dependencies may cause compatibility issues`,
        impact: "medium",
      })
    }

    // Pattern-based reasoning from learning
    const patterns = this.identifyPatterns(analysisData)
    patterns.forEach((pattern) => {
      reasoning.push({
        factor: "pattern",
        explanation: pattern.explanation,
        impact: pattern.impact,
        confidence: pattern.confidence,
      })
    })

    return reasoning
  }

  applyLearning(analysisData, context) {
    if (!this.options.learningEnabled || this.learningData.patterns.length === 0) {
      return []
    }

    const recommendations = []
    const currentState = this.summarizeAnalysis(analysisData)

    // Find matching patterns
    for (const pattern of this.learningData.patterns) {
      if (this.matchesPattern(currentState, pattern.conditions)) {
        const confidence = pattern.successRate * pattern.frequency

        if (confidence > 0.6) {
          // Only apply high-confidence patterns
          recommendations.push({
            type: "learned",
            action: pattern.action,
            message: `Based on similar projects: ${pattern.description}`,
            confidence: confidence,
            source: "learning",
            pattern: pattern.id,
          })
        }
      }
    }

    return recommendations
  }

  matchesPattern(currentState, conditions) {
    for (const [key, value] of Object.entries(conditions)) {
      if (typeof value === "object" && value.range) {
        const current = currentState[key] || 0
        if (current < value.range.min || current > value.range.max) {
          return false
        }
      } else if (currentState[key] !== value) {
        return false
      }
    }
    return true
  }

  identifyPatterns(analysisData) {
    const patterns = []
    const state = this.summarizeAnalysis(analysisData)

    // Common patterns based on project type and state
    if (state.projectType === "react" && state.outdatedCount > 3) {
      patterns.push({
        explanation: "React projects with multiple outdated dependencies often benefit from gradual updates",
        impact: "medium",
        confidence: 0.8,
      })
    }

    if (state.healthScore < 50 && state.criticalIssues > 2) {
      patterns.push({
        explanation: "Projects with low health scores and multiple critical issues require systematic fixing",
        impact: "high",
        confidence: 0.9,
      })
    }

    return patterns
  }

  findSimilarDecisions(analysisData) {
    const currentState = this.summarizeAnalysis(analysisData)

    return this.decisionHistory.filter((decision) => {
      const pastState = decision.analysis

      // Consider decisions similar if they match on key factors
      return (
        Math.abs(pastState.healthScore - currentState.healthScore) < 20 &&
        pastState.projectType === currentState.projectType &&
        Math.abs(pastState.issueCount - currentState.issueCount) < 3
      )
    })
  }

  calculateConsensus(recommendations) {
    // Calculate how much the recommendations agree with each other
    const types = recommendations.map((r) => r.type)
    const uniqueTypes = [...new Set(types)]

    // Higher consensus when recommendations are focused on fewer areas
    return Math.max(0, 1 - uniqueTypes.length / types.length)
  }

  updateLearningData(decision) {
    // This would be called after actions are executed to learn from outcomes
    // For now, we'll simulate learning by storing patterns

    const pattern = {
      id: `pattern_${Date.now()}`,
      conditions: decision.analysis,
      action: decision.recommendations[0]?.action || "no-action",
      description: decision.recommendations[0]?.message || "No action taken",
      successRate: 0.5, // Would be updated based on actual outcomes
      frequency: 1,
      lastSeen: new Date(),
    }

    this.learningData.patterns.push(pattern)
    this.saveLearningData()
  }

  loadLearningData() {
    const learningPath = path.join(__dirname, "../../data/learning.json")

    try {
      if (fs.existsSync(learningPath)) {
        return JSON.parse(fs.readFileSync(learningPath, "utf8"))
      }
    } catch (error) {
      console.log("[AI] Could not load learning data:", error.message)
    }

    return {
      patterns: [],
      outcomes: [],
      version: "1.0",
    }
  }

  saveLearningData() {
    const learningPath = path.join(__dirname, "../../data/learning.json")
    const dataDir = path.dirname(learningPath)

    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }

      fs.writeFileSync(learningPath, JSON.stringify(this.learningData, null, 2))
    } catch (error) {
      console.log("[AI] Could not save learning data:", error.message)
    }
  }

  explainDecision(decision) {
    console.log("\n=== AI Decision Explanation ===")
    console.log(`Confidence: ${decision.confidence.toFixed(1)}%`)
    console.log(`Risk Level: ${decision.riskLevel}`)
    console.log(`Recommendations: ${decision.recommendations.length}`)

    console.log("\nReasoning:")
    decision.reasoning.forEach((reason, index) => {
      console.log(`${index + 1}. [${reason.factor.toUpperCase()}] ${reason.explanation}`)
    })

    console.log("\nTop Recommendations:")
    decision.recommendations.slice(0, 5).forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority?.toUpperCase() || "MEDIUM"}] ${rec.message}`)
      if (rec.action) {
        console.log(`   Action: ${rec.action}`)
      }
    })
  }
}

class ProjectRuleEngine {
  constructor() {
    this.rules = this.initializeRules()
  }

  initializeRules() {
    return [
      {
        id: "critical-security",
        condition: (analysis) => analysis.dependencies?.vulnerable?.length > 0,
        action: (analysis) => ({
          type: "security",
          priority: "critical",
          message: `${analysis.dependencies.vulnerable.length} security vulnerabilities detected`,
          action: "bpack audit --fix",
          severity: "high",
        }),
      },
      {
        id: "missing-dependencies",
        condition: (analysis) => !analysis.structure?.hasNodeModules && analysis.dependencies?.total > 0,
        action: (analysis) => ({
          type: "setup",
          priority: "high",
          message: "Dependencies not installed",
          action: "bpack install",
          severity: "high",
        }),
      },
      {
        id: "outdated-dependencies",
        condition: (analysis) => analysis.dependencies?.outdated?.length > 5,
        action: (analysis) => ({
          type: "maintenance",
          priority: "medium",
          message: `${analysis.dependencies.outdated.length} outdated dependencies`,
          action: "bpack update",
          severity: "medium",
        }),
      },
      {
        id: "no-lockfile",
        condition: (analysis) => !analysis.structure?.hasLockfile && analysis.structure?.hasPackageJson,
        action: (analysis) => ({
          type: "setup",
          priority: "medium",
          message: "No lockfile found - dependency versions not locked",
          action: "bpack install",
          severity: "medium",
        }),
      },
      {
        id: "health-critical",
        condition: (analysis) => analysis.health?.score < 40,
        action: (analysis) => ({
          type: "health",
          priority: "critical",
          message: `Project health is critical (${analysis.health.score}/100)`,
          action: "bpack agent analyze --verbose",
          severity: "high",
        }),
      },
    ]
  }

  evaluate(analysisData, context) {
    const recommendations = []

    for (const rule of this.rules) {
      if (rule.condition(analysisData)) {
        const recommendation = rule.action(analysisData)
        recommendation.ruleId = rule.id
        recommendation.source = "rule-engine"
        recommendations.push(recommendation)
      }
    }

    return recommendations
  }
}

module.exports = { AIDecisionEngine, ProjectRuleEngine }
