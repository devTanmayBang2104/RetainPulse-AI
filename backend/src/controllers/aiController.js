const axios = require("axios");

/**
 * AI Co-Pilot Controller — RetainPulse AI
 * Supports Groq Cloud (Llama 3.3 / Llama 3.1) and OpenRouter with hardened fallback engine
 */

function generateFallbackStrategy(customerProfile, prediction) {
  const prob = (prediction.churn_probability * 100).toFixed(1);
  const monthly = customerProfile.monthlyCharges || 70;
  const tenure = customerProfile.tenure || 1;
  const contract = customerProfile.contract || "Month-to-month";

  let pitch = "";
  let actions = [];

  if (contract === "Month-to-month") {
    pitch = "propose upgrading from Month-to-Month to a 1-Year Contract with a 20% annual loyalty discount ($" + (monthly * 0.8).toFixed(2) + "/mo)";
    actions.push("Propose 1-year contract lock-in with 20% promotional discount");
  } else {
    pitch = "apply a 15% VIP loyalty discount on current plan for the next 6 months";
    actions.push("Apply $15/mo loyalty service credit");
  }

  if (customerProfile.techSupport === "No" || customerProfile.onlineSecurity === "No") {
    actions.push("Bundle complimentary 6-month TechSupport & OnlineSecurity package ($24/mo value)");
  }
  if (customerProfile.paymentMethod === "Electronic check") {
    actions.push("Incentivize auto-pay enrollment with $5/month billing credit");
  }
  if (actions.length < 4) {
    actions.push("Schedule a proactive 30-day customer satisfaction review call");
  }

  const riskAnalysis = `Subscriber ${customerProfile.customerId} has a predicted churn probability of ${prob}% (${prediction.risk_level} Risk). The primary churn drivers are a ${contract} contract, tenure of ${tenure} months, and monthly spend of $${monthly}. Proactive retention outreach is recommended.`;

  const retentionEmail = `Subject: Exclusive VIP Loyalty Offer for your RetainPulse Services

Dear Valued Customer (ID: ${customerProfile.customerId}),

Thank you for choosing RetainPulse as your telecom provider. We appreciate your loyalty and want to ensure you receive the best value and support from our network.

To show our appreciation, we have created an exclusive retention package for your account:
• Special rate: We'd like to ${pitch}.
• Premium Protection: We are adding complimentary 24/7 Priority Tech Support to your plan for the next 6 months.
• Dedicated Agent: Direct access to our Tier-1 Customer Success Team for any billing or network inquiries.

To claim this exclusive upgrade, simply reply to this email or click below to apply it instantly to your account.

Sincerely,

Sarah Jenkins
Customer Success Director
RetainPulse AI Telecom`;

  return {
    riskAnalysis,
    retentionEmail,
    actionPlan: actions.slice(0, 4),
    modelUsed: "Rule-Based Expert Engine (Offline Mode)",
    fallback: true
  };
}

function buildPrompt(customerProfile, prediction) {
  const missingServices = [];
  if (customerProfile.onlineSecurity === "No") missingServices.push("Online Security");
  if (customerProfile.techSupport === "No") missingServices.push("Technical Support");
  if (customerProfile.onlineBackup === "No") missingServices.push("Online Backup");
  
  const reasons = [];
  if (customerProfile.contract === "Month-to-month") {
    reasons.push("is on a Month-to-month contract (lacks lock-in and is highly price sensitive)");
  }
  if (customerProfile.tenure <= 6) {
    reasons.push(`is a very new subscriber with only ${customerProfile.tenure} months tenure`);
  }
  if (missingServices.length > 0) {
    reasons.push(`lacks key security/support features: ${missingServices.join(", ")}`);
  }

  return `You are an expert customer retention director at RetainPulse AI Telecom. Analyze the following subscriber profile and design a personalized retention strategy.

CUSTOMER PROFILE:
- Customer ID: ${customerProfile.customerId}
- Gender: ${customerProfile.gender}
- Senior Citizen: ${customerProfile.seniorCitizen ? "Yes" : "No"}
- Partner: ${customerProfile.partner} | Dependents: ${customerProfile.dependents}
- Tenure: ${customerProfile.tenure} months
- Contract: ${customerProfile.contract}
- Monthly Charges: $${customerProfile.monthlyCharges}
- Internet Service: ${customerProfile.internetService}
- Tech Support: ${customerProfile.techSupport}
- Online Security: ${customerProfile.onlineSecurity}
- Payment Method: ${customerProfile.paymentMethod}

CHURN RISK DIAGNOSIS:
- Churn Probability: ${(prediction.churn_probability * 100).toFixed(1)}%
- Risk Level: ${prediction.risk_level}
- Primary reasons for churn risk: ${reasons.join(" and ")}.

CRITICAL INSTRUCTIONS FOR OUTREACH TEMPLATE:
1. NO PLACEHOLDERS: Do NOT write placeholders like "[Name]", "[Your Name]", "[Subject]", or "[Deadline]".
2. Greeting: Greet them professionally using their ID, e.g., "Dear Valued Customer (ID: ${customerProfile.customerId})".
3. Specific Pitch: Offer a specific upgrade or package discount tailored to their exact profile.
4. Signature: Sign off as "Sarah Jenkins, Customer Success Director, RetainPulse AI".

You MUST return a JSON object with EXACTLY the following structure. Return ONLY raw JSON, do not include any markdown tags:
{
  "riskAnalysis": "A 2-3 sentence analysis detailing exactly why this subscriber is at risk of churning, referencing their monthly charges of $${customerProfile.monthlyCharges} and contract status.",
  "retentionEmail": "Subject: Exclusive VIP Loyalty Offer for your RetainPulse Services\\n\\nDear Valued Customer (ID: ${customerProfile.customerId}),\\n\\n...",
  "actionPlan": [
    "Step 1: Contact customer to propose switching from month-to-month to 1-year contract at 20% off",
    "Step 2: Add missing services free of charge for 6 months",
    "Step 3: Assist customer in setting up automatic payment to resolve billing friction",
    "Step 4: Update Customer Portfolio status and log the retention outreach"
  ]
}`;
}

function parseAIResponse(content, customerProfile, prediction) {
  try {
    const jsonStr = content.replace(/^```json/i, "").replace(/```$/i, "").trim();
    const data = JSON.parse(jsonStr);
    return {
      riskAnalysis: data.riskAnalysis || "High risk of churn detected due to contract status and monthly charges.",
      retentionEmail: data.retentionEmail || "Subject: We value your relationship\n\nDear customer,\n\nWe noticed you might be facing issues. We would love to offer a special discount...",
      actionPlan: Array.isArray(data.actionPlan) ? data.actionPlan : ["Review account history", "Offer upgraded support", "Provide loyalty discount", "Follow up next week"]
    };
  } catch (e) {
    return generateFallbackStrategy(customerProfile, prediction);
  }
}

/**
 * POST /api/ai/retention-strategy
 */
exports.generateRetentionStrategy = async (req, res, next) => {
  const { customerProfile = {}, prediction = { churn_probability: 0.75, risk_level: "HIGH" }, model: aiModel } = req.body;

  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  // If no API key configured, use high quality fallback immediately
  if (!groqKey && !openRouterKey) {
    const fallbackResult = generateFallbackStrategy(customerProfile, prediction);
    return res.json(fallbackResult);
  }

  const prompt = buildPrompt(customerProfile, prediction);

  try {
    if (groqKey) {
      // Use Groq Cloud for ultra-fast LLM inference
      const groqModel = aiModel || "qwen/qwen3.8-27b";
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: groqModel,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1200,
          temperature: 0.6,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json"
          },
          timeout: 15000
        }
      );

      const content = response.data.choices[0]?.message?.content || "";
      const parsed = parseAIResponse(content, customerProfile, prediction);
      return res.json({
        ...parsed,
        modelUsed: `Groq Cloud (${groqModel})`,
        tokensUsed: response.data.usage?.total_tokens
      });
    }

    if (openRouterKey) {
      const selectedModel = aiModel || "meta-llama/llama-3.1-8b-instruct";
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: selectedModel,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1200,
          temperature: 0.7,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "RetainPulse AI Co-Pilot"
          },
          timeout: 20000
        }
      );

      const content = response.data.choices[0]?.message?.content || "";
      const parsed = parseAIResponse(content, customerProfile, prediction);
      return res.json({
        ...parsed,
        modelUsed: selectedModel,
        tokensUsed: response.data.usage?.total_tokens
      });
    }
  } catch (error) {
    console.warn("AI API call failed, providing resilient fallback:", error.message);
    const fallbackResult = generateFallbackStrategy(customerProfile, prediction);
    return res.json(fallbackResult);
  }
};

/**
 * GET /api/ai/models
 */
exports.getModels = (req, res) => {
  res.json({
    models: [
      { id: "qwen/qwen3.8-27b", label: "Qwen 3.8 27B (Groq)", provider: "Groq Cloud", speed: "Ultra Fast (<500ms)" },
      { id: "qwen/qwen3.6-27b", label: "Qwen 3.6 27B (Groq)", provider: "Groq Cloud", speed: "Ultra Fast (<500ms)" },
      { id: "meta-llama/llama-3.1-8b-instruct", label: "Llama 3.1 8B (OpenRouter)", provider: "Meta", speed: "Fast" },
    ],
  });
};

/**
 * POST /api/ai/chat
 */
exports.chat = async (req, res, next) => {
  try {
    const { message, customerProfile, chatHistory = [] } = req.body;
    const groqKey = process.env.GROQ_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    let systemContext = `You are an expert Customer Retention Assistant at RetainPulse AI Telecom.
Your role is to help customer success agents analyze subscribers, write outreach emails, and recommend retention offers.`;

    if (customerProfile) {
      systemContext += `\n\nCURRENT CUSTOMER FOCUS:
- Customer ID: ${customerProfile.customerId}
- Gender: ${customerProfile.gender}
- Senior Citizen: ${customerProfile.seniorCitizen ? "Yes" : "No"}
- Partner: ${customerProfile.partner} | Dependents: ${customerProfile.dependents}
- Tenure: ${customerProfile.tenure} months
- Contract: ${customerProfile.contract}
- Monthly Charges: $${customerProfile.monthlyCharges}
- Internet Service: ${customerProfile.internetService}
- Tech Support: ${customerProfile.techSupport}
- Online Security: ${customerProfile.onlineSecurity}
- Payment Method: ${customerProfile.paymentMethod}
- Churn Risk Level: ${customerProfile.riskLevel || "HIGH"}
- Churn Probability: ${customerProfile.churnProbability !== undefined && customerProfile.churnProbability !== null ? (customerProfile.churnProbability * 100).toFixed(1) + "%" : "85%"}

Please answer questions specifically about this customer. When writing outreach emails or SMS messages, DO NOT use placeholders like '[Name]' or '[Your Name]'. Sign off as Sarah Jenkins, Customer Success Director, RetainPulse AI.`;
    }

    if (!groqKey && !openRouterKey) {
      // Fallback assistant response
      const fallbackReply = `[RetainPulse AI Assistant]\n\nBased on customer ${customerProfile?.customerId || "profile"} (Churn Risk: ${customerProfile?.riskLevel || "HIGH"}, Monthly: $${customerProfile?.monthlyCharges || 70}), here is the recommended action:\n\n1. Offer a 1-year contract renewal with a 15% loyalty discount.\n2. Add complimentary Tech Support for 6 months to improve service engagement.\n3. Send an email from Sarah Jenkins (Customer Success Director) to confirm account satisfaction.`;
      return res.json({ reply: fallbackReply, modelUsed: "RetainPulse Built-in Assistant (Offline Mode)" });
    }

    const messages = [
      { role: "system", content: systemContext },
      ...chatHistory.slice(-10),
      { role: "user", content: message }
    ];

    if (groqKey) {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages,
          max_tokens: 800,
          temperature: 0.7
        },
        {
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json"
          },
          timeout: 15000
        }
      );
      const reply = response.data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
      return res.json({ reply, modelUsed: "Groq Cloud (Llama 3.3 70B)" });
    }

    if (openRouterKey) {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "meta-llama/llama-3.1-8b-instruct",
          messages,
          max_tokens: 800,
          temperature: 0.7
        },
        {
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "RetainPulse AI Chatbot"
          },
          timeout: 20000
        }
      );
      const reply = response.data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
      return res.json({ reply, modelUsed: "meta-llama/llama-3.1-8b-instruct" });
    }
  } catch (error) {
    const fallbackReply = `I'm analyzing this subscriber's profile. They are currently showing elevated churn risk due to their contract and billing setup. I recommend proposing an annual contract conversion and complimentary support add-on.`;
    return res.json({ reply: fallbackReply, modelUsed: "RetainPulse Fallback Engine" });
  }
};

