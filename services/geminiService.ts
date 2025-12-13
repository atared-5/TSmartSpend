import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Transaction, Source, Category, FinancialInsight } from "../types";

const parseJson = (text: string) => {
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Failed to parse JSON", e);
        return null;
    }
}

export const analyzeFinances = async (
  transactions: Transaction[],
  sources: Source[],
  categories: Category[]
): Promise<FinancialInsight | null> => {
  if (!process.env.API_KEY) {
    console.warn("API Key not found");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare data context
  const recentTransactions = transactions.slice(0, 50); // Analyze last 50 for speed
  const totalBalance = sources.reduce((acc, s) => acc + s.balance, 0);
  
  const contextString = `
    Current Total Balance: ${totalBalance}
    Sources: ${sources.map(s => `${s.name}: ${s.balance}`).join(', ')}
    Recent Transactions:
    ${JSON.stringify(recentTransactions.map(t => ({
      amount: t.amount,
      category: categories.find(c => c.id === t.categoryId)?.name || 'Unknown',
      date: t.date,
      note: t.note
    })))}
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: "A friendly 1-sentence summary of the user's recent spending behavior." },
      spendingTrend: { type: Type.STRING, enum: ['increasing', 'decreasing', 'stable'] },
      actionableTip: { type: Type.STRING, description: "A specific, short advice based on the data to help them save money." }
    },
    required: ["summary", "spendingTrend", "actionableTip"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a personal financial assistant. Analyze the provided financial data and provide insights. Data: ${contextString}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (text) {
        return parseJson(text) as FinancialInsight;
    }
    return null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};
