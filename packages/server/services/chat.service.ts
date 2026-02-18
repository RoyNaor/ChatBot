import dotenv from "dotenv";
import OpenAI from "openai";
import z from "zod";
import { ConversationRepository } from "../repositories/conversation.repository";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- הגדרות סכימה לאימות (Zod) ---
const intentEnum = z.enum(["constraint", "schedule_query", "general", "out_of_scope"]);
const constraintTypeEnum = z.enum(["HARD", "SOFT"]);

const constraintDataSchema = z.object({
  start_time: z.string().datetime({ offset: true }),
  end_time: z.string().datetime({ offset: true }),
  type: z
    .string()
    .transform((val) => val.toUpperCase())
    .pipe(constraintTypeEnum)
    .default("HARD"),
});

const llmResponseSchema = z.object({
  intent: intentEnum,
  confidence: z.number().min(0).max(1),
  data: constraintDataSchema.nullable(), // חייב להיות nullable בגלל ה-API
  assistant_reply: z.string().min(1),
});

export type ChatIntent = z.infer<typeof intentEnum>;

export interface ChatResponse {
  id: string;
  output_text: string;
  intent: ChatIntent;
  confidence: number;
  data?: z.infer<typeof constraintDataSchema>;
}

// --- הפרומפט המלא והמפורט ---
const systemPrompt = `You are an intent detection and reply assistant for a scheduling chatbot.

CRITICAL OUTPUT RULES:
1) Output must be valid JSON only.
2) Use exactly the provided JSON schema.
3) Include "data" ONLY when intent is "constraint". If intent is anything else, "data" MUST be null.
4) For "constraint", choose data.type:
   - HARD = strict cannot/unavailable (e.g., "אני לא יכול", "אסור לי").
   - SOFT = preference/avoid-if-possible (e.g., "עדיף שלא", "מעדיף להימנע").
   - If unclear, default to HARD.
5) For "schedule_query", assistant_reply should indicate you are checking the schedule.
6) For "general", be friendly, answer greetings (Hi/How are you), and keep it short.

HEBREW + NLP RULES:
- Understand fluent Hebrew, mixed Hebrew-English, and slang.
- Correctly interpret Hebrew day/time expressions:
  * "יום שלישי בערב" -> Tuesday 18:00-22:00
  * "שישי בבוקר" -> Friday 08:00-12:00
  * "מחר" -> Calculate based on current date.
- Preserve the user's language in assistant_reply; if user writes Hebrew, reply in Hebrew.
- For extracted datetime fields, always return ISO-8601 with timezone (+02:00 or +03:00 depending on season).

CURRENT DATE CONTEXT:
The current date is Wednesday, Feb 18, 2026.
`;

export const ChatService = {
  async sendMessage(message: string, conversationId: string): Promise<ChatResponse> {
    
    // שליפת היסטוריה
    const lastResponseId = ConversationRepository.getLastResponseId(conversationId);

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      previous_response_id: lastResponseId,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.3,
      text: {
        format: {
          type: "json_schema",
          name: "chat_intent_response",
          strict: true,
          schema: {
            type: "object",
            properties: {
              intent: { type: "string", enum: ["constraint", "schedule_query", "general", "out_of_scope"] },
              confidence: { type: "number" },
              assistant_reply: { type: "string" },
              data: {
                anyOf: [
                  {
                    type: "object",
                    properties: {
                      start_time: { type: "string" },
                      end_time: { type: "string" },
                      type: { type: "string", enum: ["HARD", "SOFT"] },
                    },
                    required: ["start_time", "end_time", "type"],
                    additionalProperties: false,
                  },
                  { type: "null" },
                ],
              },
            },
            required: ["intent", "confidence", "assistant_reply", "data"],
            additionalProperties: false,
          },
        },
      },
    });

    // שמירת ה-ID החדש
    ConversationRepository.setLastResponseId(conversationId, response.id);

    const rawOutput = response.output_text || "";
    
    try {
      const parsedJson = JSON.parse(rawOutput);
      const validated = llmResponseSchema.parse(parsedJson);

      return {
        id: response.id,
        output_text: validated.assistant_reply,
        intent: validated.intent,
        confidence: validated.confidence,
        data: validated.data || undefined, // הופך null ל-undefined בשביל ה-Interface
      };
    } catch (error) {
      console.error("Internal Logic Error:", error);
      return {
        id: response.id,
        output_text: "אופס, משהו השתבש לי בחישוב. אפשר לנסות שוב?",
        intent: "general",
        confidence: 0,
      };
    }
  },
};