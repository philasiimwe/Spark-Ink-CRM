
import { GoogleGenAI, Type } from "@google/genai";
import { Deal, Activity, Contact } from "../types";
import { supabase } from '../lib/supabase';

const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });

// ===============================================
// AI LEAD SCORING
// ===============================================

export async function scoreLeadWithAI(contact: Contact, activities: Activity[], deals: Deal[]) {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: `You are an expert sales AI. Analyze this lead and provide a comprehensive scoring.

Contact Information:
- Name: ${contact.name}
- Company: ${contact.company}
- Job Title: ${contact.jobTitle || 'Unknown'}
- Industry: ${contact.industry || 'Unknown'}
- Company Size: ${contact.companySize || 'Unknown'}
- Location: ${contact.location || 'Unknown'}
- LinkedIn: ${contact.linkedinUrl ? 'Yes' : 'No'}

Engagement History:
- Total Activities: ${activities.length}
- Open Deals: ${deals.filter(d => d.stage !== 'CLOSED_WON' && d.stage !== 'CLOSED_LOST').length}
- Total Deal Value: $${deals.reduce((sum, d) => sum + d.value, 0)}

Analyze and provide:
1. Lead score (0-100)
2. Score breakdown by category
3. Key insights
4. Recommended next actions`,

            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        leadScore: { type: Type.NUMBER, description: "Overall lead score 0-100" },
                        breakdown: {
                            type: Type.OBJECT,
                            properties: {
                                companyFit: { type: Type.NUMBER },
                                engagement: { type: Type.NUMBER },
                                intent: { type: Type.NUMBER },
                                timing: { type: Type.NUMBER }
                            }
                        },
                        insights: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        nextActions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        priority: {
                            type: Type.STRING,
                            enum: ["low", "medium", "high", "urgent"]
                        }
                    }
                }
            }
        });

        const result = response.text ? JSON.parse(response.text) : null;
        return result;
    } catch (error) {
        console.error("AI Lead Scoring Error:", error);
        return null;
    }
}

// ===============================================
// AI EMAIL DRAFTING
// ===============================================

export async function draftEmailWithAI(context: {
    contact: Contact;
    deal?: Deal;
    purpose: 'follow-up' | 'introduction' | 'proposal' | 'check-in' | 'closing';
    previousEmails?: string[];
    customInstructions?: string;
}) {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: `You are a professional sales email writer. Draft a personalized email.

Contact: ${context.contact.name} (${context.contact.jobTitle || ''} at ${context.contact.company})
Purpose: ${context.purpose}
${context.deal ? `Deal: ${context.deal.title} - $${context.deal.value}` : ''}
${context.customInstructions ? `Special Instructions: ${context.customInstructions}` : ''}

Previous email thread:
${context.previousEmails?.join('\n---\n') || 'No previous emails'}

Write a professional, personalized email that:
- Is concise and value-focused
- References specific details about their company/role
- Has a clear call-to-action
- Maintains a warm, professional tone
- Avoids generic sales language`,

            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subject: { type: Type.STRING },
                        body: { type: Type.STRING },
                        tone: { type: Type.STRING },
                        suggestions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        return response.text ? JSON.parse(response.text) : null;
    } catch (error) {
        console.error("AI Email Drafting Error:", error);
        return null;
    }
}

// ===============================================
// AI MEETING SUMMARIZATION
// ===============================================

export async function summarizeMeetingWithAI(transcript: string, participants: string[]) {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: `Summarize this sales meeting transcript.

Participants: ${participants.join(', ')}

Transcript:
${transcript}

Provide a comprehensive summary including:
- Key discussion points
- Decisions made
- Action items with owners
- Next steps
- Sentiment/tone of the meeting`,

            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        keyPoints: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        decisions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        actionItems: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    task: { type: Type.STRING },
                                    owner: { type: Type.STRING },
                                    dueDate: { type: Type.STRING }
                                }
                            }
                        },
                        nextSteps: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        sentiment: {
                            type: Type.STRING,
                            enum: ["positive", "neutral", "negative", "mixed"]
                        }
                    }
                }
            }
        });

        return response.text ? JSON.parse(response.text) : null;
    } catch (error) {
        console.error("AI Meeting Summary Error:", error);
        return null;
    }
}

// ===============================================
// AI SENTIMENT ANALYSIS
// ===============================================

export async function analyzeSentimentWithAI(text: string, source: 'email' | 'note' | 'call') {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: `Analyze the sentiment and emotional tone of this ${source}.

Text:
${text}

Provide detailed sentiment analysis including overall sentiment, key emotions, concerns, and opportunities.`,

            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        overallSentiment: {
                            type: Type.STRING,
                            enum: ["very_positive", "positive", "neutral", "negative", "very_negative"]
                        },
                        score: { type: Type.NUMBER, description: "Sentiment score from -1 to 1" },
                        emotions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        concerns: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        opportunities: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        urgency: {
                            type: Type.STRING,
                            enum: ["low", "medium", "high", "critical"]
                        }
                    }
                }
            }
        });

        return response.text ? JSON.parse(response.text) : null;
    } catch (error) {
        console.error("AI Sentiment Analysis Error:", error);
        return null;
    }
}

// ===============================================
// AI DEAL HEALTH SCORING
// ===============================================

export async function scoreDealHealthWithAI(deal: Deal, activities: Activity[], contact: Contact) {
    try {
        const daysSinceLastActivity = deal.updatedAt
            ? Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
            : 999;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: `Analyze the health of this sales deal.

Deal Details:
- Title: ${deal.title}
- Value: ${deal.currency}${deal.value}
- Stage: ${deal.stage}
- Probability: ${deal.probability}%
- Age: ${Math.floor((Date.now() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
- Days Since Last Activity: ${daysSinceLastActivity}
- Priority: ${deal.priority}

Contact: ${contact.name} (${contact.jobTitle} at ${contact.company})

Activities: ${activities.length} total
- Calls: ${activities.filter(a => a.type === 'CALL').length}
- Meetings: ${activities.filter(a => a.type === 'MEETING').length}
- Emails: ${activities.filter(a => a.type === 'EMAIL').length}

Analyze the deal health and provide actionable insights.`,

            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        healthScore: { type: Type.NUMBER, description: "Overall health score 0-100" },
                        riskLevel: {
                            type: Type.STRING,
                            enum: ["low", "medium", "high", "critical"]
                        },
                        factors: {
                            type: Type.OBJECT,
                            properties: {
                                engagement: { type: Type.STRING },
                                momentum: { type: Type.STRING },
                                timing: { type: Type.STRING },
                                competition: { type: Type.STRING }
                            }
                        },
                        warnings: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        recommendations: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        predictedCloseDate: { type: Type.STRING },
                        winProbability: { type: Type.NUMBER }
                    }
                }
            }
        });

        return response.text ? JSON.parse(response.text) : null;
    } catch (error) {
        console.error("AI Deal Health Scoring Error:", error);
        return null;
    }
}

// ===============================================
// AI NEXT BEST ACTION
// ===============================================

export async function getNextBestActionWithAI(deal: Deal, activities: Activity[], contact: Contact, emails?: any[]) {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: `You are a sales strategy AI. Recommend the next best action for this deal.

Deal: ${deal.title} - ${deal.stage}
Contact: ${contact.name} (${contact.company})
Last Activity: ${activities[0]?.subject || 'None'}
Deal Age: ${Math.floor((Date.now() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days

Recent Activities:
${activities.slice(0, 5).map(a => `- ${a.type}: ${a.subject}`).join('\n')}

Based on the deal stage, engagement pattern, and contact information, recommend the single most impactful next action.`,

            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        action: { type: Type.STRING },
                        actionType: {
                            type: Type.STRING,
                            enum: ["call", "email", "meeting", "demo", "proposal", "follow_up"]
                        },
                        reasoning: { type: Type.STRING },
                        timing: { type: Type.STRING },
                        talkingPoints: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        resources: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        return response.text ? JSON.parse(response.text) : null;
    } catch (error) {
        console.error("AI Next Best Action Error:", error);
        return null;
    }
}

// ===============================================
// AI SALES FORECASTING
// ===============================================

export async function getSalesForecastWithAI(deals: Deal[]) {
    try {
        const openDeals = deals.filter(d => d.stage !== 'CLOSED_WON' && d.stage !== 'CLOSED_LOST');
        const wonDeals = deals.filter(d => d.stage === 'CLOSED_WON');

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: `Analyze this sales pipeline and provide a forecast.

Pipeline Summary:
- Total Open Deals: ${openDeals.length}
- Total Pipeline Value: $${openDeals.reduce((sum, d) => sum + d.value, 0)}
- Weighted Value: $${openDeals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0)}
- Average Deal Size: $${openDeals.reduce((sum, d) => sum + d.value, 0) / openDeals.length || 0}
- Wins This Quarter: ${wonDeals.length}
- Revenue Won: $${wonDeals.reduce((sum, d) => sum + d.value, 0)}

Stage Breakdown:
${Array.from(new Set(deals.map(d => d.stage))).map(stage => {
                const stageDeals = openDeals.filter(d => d.stage === stage);
                return `- ${stage}: ${stageDeals.length} deals, $${stageDeals.reduce((sum, d) => sum + d.value, 0)}`;
            }).join('\n')}

Provide an executive forecast summary with confidence level and key insights.`,

            config: {
                systemInstruction: "You are a sales forecasting expert. Provide realistic, data-driven insights."
            }
        });

        return response.text || "Unable to generate forecast at this time.";
    } catch (error) {
        console.error("Forecast Error:", error);
        return "Unable to generate forecast at this time.";
    }
}

// ===============================================
// AI DEAL INSIGHTS (Enhanced)
// ===============================================

export async function getDealInsightsWithAI(deal: Deal, activities: Activity[], contact: Contact) {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: `Provide comprehensive insights for this sales opportunity.

Deal: ${deal.id} - ${deal.title}
Value: ${deal.currency}${deal.value}
Stage: ${deal.stage}
Contact: ${contact.name} (${contact.company})
Activities: ${activities.map(a => `${a.type}: ${a.subject} (${a.dueDate})`).join(', ')}`,

            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING, description: "One paragraph summary of the deal status" },
                        riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                        nextSteps: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Top 3 recommended actions"
                        },
                        suggestedEmailDraft: { type: Type.STRING, description: "A personalized follow-up email draft" },
                        competitivePosition: { type: Type.STRING },
                        closeTimeframe: { type: Type.STRING }
                    },
                    required: ["summary", "riskLevel", "nextSteps", "suggestedEmailDraft"]
                }
            }
        });

        return response.text ? JSON.parse(response.text) : null;
    } catch (error) {
        console.error("Gemini API Error:", error);
        return null;
    }
}

// ===============================================
// AI CHATBOT / CONVERSATIONAL AI
// ===============================================

export async function chatWithAI(message: string, context?: {
    deals?: Deal[];
    contacts?: Contact[];
    activities?: Activity[];
}) {
    try {
        const contextInfo = context ? `
Current CRM Context:
- ${context.deals?.length || 0} deals in pipeline
- ${context.contacts?.length || 0} contacts
- ${context.activities?.length || 0} pending activities
` : '';

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: `You are Nexus AI, an intelligent CRM assistant. Help the user with their question.

${contextInfo}

User Question: ${message}

Provide a helpful, actionable response. If the question relates to CRM data, provide specific insights. If it's a general sales question, provide expert advice.`,

            config: {
                temperature: 0.7,
                maxOutputTokens: 1024
            }
        });

        return response.text || "I'm sorry, I couldn't process that request.";
    } catch (error) {
        console.error("AI Chat Error:", error);
        return "I'm experiencing technical difficulties. Please try again.";
    }
}

// ===============================================
// BATCH AI PROCESSING
// ===============================================

export async function batchScoreLeads(contacts: Contact[]) {
    const results = [];

    for (const contact of contacts) {
        // Get related data
        const { data: activities } = await supabase
            .from('activities')
            .select('*')
            .eq('contact_id', contact.id);

        const { data: deals } = await supabase
            .from('deals')
            .select('*')
            .eq('contact_id', contact.id);

        const score = await scoreLeadWithAI(contact, activities || [], deals || []);

        if (score) {
            results.push({
                contactId: contact.id,
                score: score.leadScore,
                priority: score.priority
            });

            // Update contact with AI score
            await supabase
                .from('contacts')
                .update({ lead_score: score.leadScore })
                .eq('id', contact.id);
        }
    }

    return results;
}

export default {
    scoreLeadWithAI,
    draftEmailWithAI,
    summarizeMeetingWithAI,
    analyzeSentimentWithAI,
    scoreDealHealthWithAI,
    getNextBestActionWithAI,
    getSalesForecastWithAI,
    getDealInsightsWithAI,
    chatWithAI,
    batchScoreLeads
};
