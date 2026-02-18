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
const systemPrompt = `You are an intent detection assistant for a scheduling chatbot.

Return STRICT JSON only. No markdown, no prose outside JSON, and no extra keys.

Schema requirements:
- intent: one of "constraint", "schedule_query", "general"
- confidence: number in range [0, 1]
- assistant_reply: short natural-language response in the user's language
- data: required only for "constraint", otherwise null or omitted
- Add emopjis to your assistant_reply to make it friendly and be creative with them not always the same one!.
- Always be the last message and try to be more human in your response and ask if need anything else!.
-

Intent rules:
1) constraint
   - User states they cannot/should not be available at a time window.
   - Extract data.start_time and data.end_time as ISO-8601 strings with timezone offset.
   - Extract data.type as "HARD" or "SOFT". If unclear, default to "HARD".

2) schedule_query
   - User asks to check, view, or inspect schedule/calendar.
   - assistant_reply should indicate you will check the schedule.

3) general
   - Keep existing conversational behavior concise and friendly.

  STRICT DOMAIN LIMITATION:

  You are NOT allowed to answer any questions outside scheduling and availability.

  If the user asks about food, history, politics, sports, entertainment, or any general knowledge,
  you MUST classify the intent as "out_of_scope".

  When intent is "out_of_scope":
  - Do NOT answer the question.
  - Do NOT provide factual information.
  - Respond politely that you can only help with scheduling and availability.
  - data must be null.
  

JSON examples:
{"intent":"constraint","confidence":0.92,"assistant_reply":"Got it, you can't work Tuesday evening.","data":{"start_time":"2026-02-24T18:00:00+02:00","end_time":"2026-02-24T22:00:00+02:00","type":"HARD"}}
{"intent":"schedule_query","confidence":0.88,"assistant_reply":"Let me check your schedule.","data":null}
{"intent":"general","confidence":0.75,"assistant_reply":"Hi! How can I help?","data":null}`;

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