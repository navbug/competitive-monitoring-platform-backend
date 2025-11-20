const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// ✅ FIXED: Use correct model name
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

class GeminiService {
  async classifyUpdate(title, content, competitorName) {
    try {
      const prompt = `Analyze this Project Management SaaS competitor update and provide classification in JSON format.

Competitor: ${competitorName} (Project Management Tool)
Title: ${title}
Content: ${content.substring(0, 2000)}

Classify this update and respond ONLY with a JSON object (no markdown, no backticks) with these fields:
{
  "category": "one of: pricing, feature_release, integration, blog_post, case_study, webinar, product_update, other",
  "impactLevel": "one of: low, medium, high, critical",
  "tags": ["keyword1", "keyword2", "keyword3"],
  "summary": "2-3 sentence summary",
  "sentiment": "one of: positive, neutral, negative",
  "hasPricing": true or false,
  "confidence": 0.0 to 1.0,
  "affectedFeatures": ["list of features mentioned like: automation, integrations, reporting, mobile, etc."]
}

Consider for Project Management context:
- Pricing changes, new pricing tiers = CRITICAL impact
- Major feature releases (automation, AI, integrations) = HIGH impact
- New integrations with popular tools = HIGH impact
- Blog posts, case studies = LOW impact
- Product updates, UI improvements = MEDIUM impact
- Webinars, educational content = LOW impact

Focus on: pricing models, feature sets, integrations, team collaboration, automation, reporting capabilities.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean and parse JSON
      const cleanText = text.replace(/```json|```/g, "").trim();
      const classification = JSON.parse(cleanText);

      return {
        success: true,
        data: classification,
      };
    } catch (error) {
      console.error("Gemini classification error:", error.message);

      // Fallback to rule-based classification
      return {
        success: false,
        data: this.fallbackClassification(title, content),
      };
    }
  }

  // ✅ FIXED: Updated fallback with PM-specific categories
  fallbackClassification(title, content) {
    const lowerTitle = title.toLowerCase();
    const lowerContent = content.toLowerCase();

    // Simple keyword matching for Project Management SaaS
    let category = "other";
    let impactLevel = "medium";
    let tags = [];
    let affectedFeatures = [];

    // Pricing
    if (
      lowerTitle.includes("price") ||
      lowerTitle.includes("pricing") ||
      lowerContent.includes("$") ||
      lowerContent.includes("price") ||
      lowerTitle.includes("plan") ||
      lowerContent.includes("tier")
    ) {
      category = "pricing";
      impactLevel = "critical";
      tags.push("pricing", "plans");
    }
    // Feature release
    else if (
      lowerTitle.includes("new feature") ||
      lowerTitle.includes("release") ||
      lowerTitle.includes("announcing") ||
      lowerTitle.includes("introducing") ||
      lowerContent.includes("now available")
    ) {
      category = "feature_release";
      impactLevel = "high";
      tags.push("feature", "release");
    }
    // Integration
    else if (
      lowerTitle.includes("integration") ||
      lowerContent.includes("integrate") ||
      lowerTitle.includes("connect") ||
      lowerContent.includes("api")
    ) {
      category = "integration";
      impactLevel = "high";
      tags.push("integration", "connectivity");
    }
    // Product update
    else if (
      lowerTitle.includes("update") ||
      lowerTitle.includes("improvement") ||
      lowerContent.includes("enhanced")
    ) {
      category = "product_update";
      impactLevel = "medium";
      tags.push("update", "improvement");
    }
    // Case study
    else if (
      lowerTitle.includes("case study") ||
      lowerTitle.includes("customer story") ||
      lowerContent.includes("success story")
    ) {
      category = "case_study";
      impactLevel = "low";
      tags.push("case-study", "customer");
    }
    // Webinar
    else if (
      lowerTitle.includes("webinar") ||
      lowerTitle.includes("workshop") ||
      lowerTitle.includes("training")
    ) {
      category = "webinar";
      impactLevel = "low";
      tags.push("webinar", "education");
    }
    // Blog post
    else if (lowerContent.length > 500) {
      category = "blog_post";
      impactLevel = "low";
      tags.push("blog", "content");
    }

    // Detect affected features
    const features = [
      "automation",
      "reporting",
      "dashboard",
      "mobile",
      "api",
      "integration",
      "collaboration",
      "notification",
      "template",
      "workflow",
      "timeline",
      "gantt",
      "kanban",
      "calendar",
    ];

    features.forEach((feature) => {
      if (lowerContent.includes(feature)) {
        affectedFeatures.push(feature);
      }
    });

    return {
      category,
      impactLevel,
      tags,
      summary: title.substring(0, 200),
      sentiment: "neutral",
      hasPricing: lowerContent.includes("$") || lowerContent.includes("price"),
      confidence: 0.5,
      affectedFeatures: affectedFeatures.slice(0, 5),
    };
  }

  async analyzeTrends(updates) {
    try {
      const updateTexts = updates
        .map(
          (u) =>
            `${u.competitor.name}: ${u.title} (Category: ${u.classification.category})`
        )
        .join("\n");

      const prompt = `Analyze these Project Management SaaS competitor updates for patterns and trends.

Updates:
${updateTexts}

Context: These are all from Project Management tools (Trello, Asana, Monday.com, ClickUp).
Look for patterns in: pricing strategies, feature releases, integration announcements, market positioning.

Identify trends and respond ONLY with a JSON object (no markdown) with:
{
  "trends": [
    {
      "pattern": "brief description of pattern (e.g., 'Multiple competitors adding AI features')",
      "competitors": ["competitor names involved"],
      "significance": "low, medium, or high",
      "insights": "what this means for the market and your strategy",
      "category": "pricing, feature_release, integration, or market_trend"
    }
  ]
}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const cleanText = text.replace(/```json|```/g, "").trim();
      const analysis = JSON.parse(cleanText);

      return {
        success: true,
        data: analysis,
      };
    } catch (error) {
      console.error("Gemini trend analysis error:", error.message);
      return {
        success: false,
        data: { trends: [] },
      };
    }
  }

  async generateInsights(competitor, recentUpdates) {
    try {
      const updateSummary = recentUpdates
        .map(
          (u) =>
            `- ${u.classification.category}: ${u.title} (${u.classification.impactLevel} impact)`
        )
        .join("\n");

      const prompt = `Generate competitive insights for this Project Management SaaS competitor.

Competitor: ${competitor.name}
Industry: Project Management SaaS
Recent Activity:
${updateSummary}

Provide strategic insights in JSON format (no markdown):
{
  "keyInsights": [
    "insight 1 about their strategy",
    "insight 2 about features/pricing",
    "insight 3 about market positioning"
  ],
  "activityLevel": "low, medium, or high",
  "strategicFocus": "what they're focusing on (e.g., 'Enterprise features', 'AI integration', 'Pricing competition')",
  "recommendations": [
    "actionable recommendation 1 based on their moves",
    "actionable recommendation 2"
  ],
  "competitiveAdvantage": "what they seem to be emphasizing",
  "potentialThreats": "what threats they pose to your product"
}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const cleanText = text.replace(/```json|```/g, "").trim();
      const insights = JSON.parse(cleanText);

      return {
        success: true,
        data: insights,
      };
    } catch (error) {
      console.error("Gemini insights error:", error.message);
      return {
        success: false,
        data: null,
      };
    }
  }
}

module.exports = new GeminiService();