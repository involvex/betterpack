const { AutomatedAgent } = require("./agent-core.cjs")
const { AIDecisionEngine } = require("./ai-decision-engine.cjs")

class SmartAutomatedAgent extends AutomatedAgent {
  constructor(options = {}) {
    super(options)

    this.aiEngine = new AIDecisionEngine({
      learningEnabled: options.learningEnabled !== false,
      riskTolerance: options.riskTolerance || "medium",
      ...options,
    })

    this.smartMode = options.smartMode !== false
    this.explainDecisions = options.explainDecisions || false
  }

  async performAnalysis() {
    console.log("[Smart Agent] Performing intelligent project analysis...")

    // Get base analysis
    this.lastAnalysis = await this.analyzer.analyzeProject()

    // Apply AI decision making if smart mode is enabled
    if (this.smartMode) {
      const context = {
        previousActions: this.actionHistory.slice(-5),
        agentOptions: this.options,
        timestamp: new Date(),
      }

      this.lastDecision = await this.aiEngine.makeDecision(this.lastAnalysis, context)

      if (this.explainDecisions) {
        this.aiEngine.explainDecision(this.lastDecision)
      }

      // Override recommendations with AI decisions
      this.lastAnalysis.aiRecommendations = this.lastDecision.recommendations
      this.lastAnalysis.aiReasoning = this.lastDecision.reasoning
      this.lastAnalysis.aiConfidence = this.lastDecision.confidence
    }

    const summary = this.analyzer.getAnalysisSummary()
    console.log(`[Smart Agent] Analysis complete - Health: ${summary.healthStatus} (${summary.healthScore}/100)`)

    if (this.smartMode && this.lastDecision) {
      console.log(
        `[Smart Agent] AI Confidence: ${this.lastDecision.confidence.toFixed(1)}% | Risk: ${this.lastDecision.riskLevel}`,
      )
      console.log(`[Smart Agent] Generated ${this.lastDecision.recommendations.length} intelligent recommendations`)
    }

    return this.lastAnalysis
  }

  async executeRecommendations() {
    if (!this.lastAnalysis || !this.options.autoFix) {
      return
    }

    console.log("[Smart Agent] Executing AI-powered recommendations...")

    // Use AI recommendations if available, otherwise fall back to base recommendations
    const recommendations = this.lastAnalysis.aiRecommendations || this.lastAnalysis.recommendations

    for (const recommendation of recommendations) {
      if (this.shouldExecuteSmartRecommendation(recommendation)) {
        await this.executeSmartRecommendation(recommendation)
      }
    }

    // Update AI learning based on execution results
    if (this.smartMode && this.lastDecision) {
      await this.updateAILearning()
    }
  }

  shouldExecuteSmartRecommendation(recommendation) {
    // Enhanced decision making using AI confidence and risk assessment
    if (!this.smartMode) {
      return super.shouldExecuteRecommendation(recommendation)
    }

    const { aggressiveness } = this.options
    const confidence = this.lastDecision?.confidence || 50
    const riskLevel = this.lastDecision?.riskLevel || "medium"

    // Don't execute if confidence is too low
    if (confidence < 60 && aggressiveness !== "aggressive") {
      console.log(`[Smart Agent] Skipping recommendation due to low confidence: ${confidence.toFixed(1)}%`)
      return false
    }

    // Consider risk level
    if (riskLevel === "high" && aggressiveness === "conservative") {
      console.log(`[Smart Agent] Skipping high-risk recommendation in conservative mode`)
      return false
    }

    // Priority-based execution
    if (recommendation.priority === "critical") return true
    if (recommendation.priority === "high" && aggressiveness !== "conservative") return true
    if (recommendation.priority === "medium" && aggressiveness === "aggressive") return true

    return false
  }

  async executeSmartRecommendation(recommendation) {
    console.log(`[Smart Agent] Executing AI recommendation: ${recommendation.message}`)
    console.log(`[Smart Agent] Priority: ${recommendation.priority} | Source: ${recommendation.source}`)

    try {
      // Execute the recommendation
      await this.executeRecommendation(recommendation)

      // Record successful execution
      this.actionHistory.push({
        timestamp: new Date(),
        action: "smart-recommendation",
        recommendation: recommendation,
        status: "success",
        aiConfidence: this.lastDecision?.confidence,
        riskLevel: this.lastDecision?.riskLevel,
      })
    } catch (error) {
      console.error(`[Smart Agent] Failed to execute recommendation: ${recommendation.message}`, error.message)

      // Record failed execution for learning
      this.actionHistory.push({
        timestamp: new Date(),
        action: "smart-recommendation",
        recommendation: recommendation,
        status: "failed",
        error: error.message,
        aiConfidence: this.lastDecision?.confidence,
        riskLevel: this.lastDecision?.riskLevel,
      })
    }
  }

  async updateAILearning() {
    // Update AI learning based on execution outcomes
    const recentActions = this.actionHistory.slice(-5)
    const successfulActions = recentActions.filter((a) => a.status === "success").length
    const successRate = recentActions.length > 0 ? successfulActions / recentActions.length : 0.5

    console.log(`[Smart Agent] Updating AI learning - Recent success rate: ${(successRate * 100).toFixed(1)}%`)

    // This would feed back into the AI engine's learning system
    // For now, we'll just log the learning update
  }

  getSmartStatus() {
    const baseStatus = super.getStatus()

    return {
      ...baseStatus,
      smartMode: this.smartMode,
      aiEngine: {
        enabled: this.smartMode,
        lastDecision: this.lastDecision
          ? {
              confidence: this.lastDecision.confidence,
              riskLevel: this.lastDecision.riskLevel,
              recommendationCount: this.lastDecision.recommendations.length,
              timestamp: this.lastDecision.timestamp,
            }
          : null,
        learningEnabled: this.aiEngine.options.learningEnabled,
        riskTolerance: this.aiEngine.options.riskTolerance,
      },
    }
  }

  async generateSmartReport() {
    const baseReport = await super.generateReport()

    if (this.smartMode && this.lastDecision) {
      baseReport.aiDecision = {
        confidence: this.lastDecision.confidence,
        riskLevel: this.lastDecision.riskLevel,
        reasoning: this.lastDecision.reasoning,
        recommendations: this.lastDecision.recommendations.map((rec) => ({
          type: rec.type,
          priority: rec.priority,
          message: rec.message,
          source: rec.source,
        })),
      }
    }

    return baseReport
  }
}

module.exports = { SmartAutomatedAgent }
