import dotenv from "dotenv";
import OpenAI from "openai";
import z from "zod";
import { ConversationRepository } from "../repositories/conversation.repository";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const intentEnum = z.enum(["constraint", "schedule_query", "general"]);
const constraintTypeEnum = z.enum(["HARD", "SOFT"]);

const constraintDataSchema = z.object({
  start_time: z.string().datetime({ offset: true }),
  end_time: z.string().datetime({ offset: true }),
  type: z
    .string()
    .transform((value) => value.toUpperCase())
    .pipe(constraintTypeEnum)
    .default("HARD"),
});

const llmResponseSchema = z.object({
  intent: intentEnum,
  confidence: z.number().min(0).max(1).optional(),
  data: constraintDataSchema.optional(),
  assistant_reply: z.string().min(1),
}).superRefine((value, ctx) => {
  if (value.intent === "constraint" && !value.data) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["data"],
      message: "data is required when intent is constraint",
    });
  }

  if (value.intent !== "constraint" && value.data) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["data"],
      message: "data must only be present for constraint intent",
    });
  }
});

export type ChatIntent = z.infer<typeof intentEnum>;

export interface ChatResponse {
  id: string;
  output_text: string;
  intent: ChatIntent;
  confidence?: number;
  data?: {
    start_time: string;
    end_time: string;
    type: z.infer<typeof constraintTypeEnum>;
  };
}

const systemPrompt = `You are an intent detection and reply assistant for a scheduling chatbot.

CRITICAL OUTPUT RULES:
1) Output must be valid JSON only.
2) Do not include markdown, backticks, explanations, or any text outside JSON.
3) Use exactly this shape:
{
  "intent": "constraint" | "schedule_query" | "general",
  "confidence": number between 0 and 1,
  "data": {
    "start_time": "ISO-8601 datetime string with timezone",
    "end_time": "ISO-8601 datetime string with timezone",
    "type": "HARD" | "SOFT"
  },
  "assistant_reply": "string"
}
4) Include "data" only when intent is "constraint".
5) For "constraint", choose data.type:
   - HARD = strict cannot/unavailable constraints.
   - SOFT = preference/avoid-if-possible constraints.
   - If unclear, default to HARD.
6) For "schedule_query", assistant_reply should indicate checking schedule.
7) For "general", keep normal assistant behavior and provide a helpful reply.

HEBREW + NLP RULES:
- Understand fluent Hebrew, mixed Hebrew-English, slang, and natural language phrasing.
- Correctly interpret Hebrew day/time expressions (e.g., "ביום שלישי בערב", "מחר בבוקר", "לא יכול בין 14:00 ל-16:00").
- Preserve the user's language in assistant_reply; if user writes Hebrew, reply in Hebrew.
- For extracted datetime fields, always return ISO-8601 with timezone.

INTENT EXAMPLES (for behavior guidance only):
1) User: "אני לא יכול לעבוד ביום שלישי בערב"
   Output: {"intent":"constraint","confidence":0.92,"data":{"start_time":"2026-03-03T18:00:00+02:00","end_time":"2026-03-03T22:00:00+02:00","type":"HARD"},"assistant_reply":"הבנתי, אתה לא זמין בשלישי בערב."}
2) User: "עדיף שלא אעבוד בשישי בבוקר"
   Output: {"intent":"constraint","confidence":0.88,"data":{"start_time":"2026-03-06T08:00:00+02:00","end_time":"2026-03-06T12:00:00+02:00","type":"SOFT"},"assistant_reply":"קיבלתי, זו העדפה להימנע משישי בבוקר."}
3) User: "Can you check my schedule for tomorrow afternoon?"
   Output: {"intent":"schedule_query","confidence":0.95,"assistant_reply":"Let me check your schedule."}
4) User: "מה נשמע?"
   Output: {"intent":"general","confidence":0.97,"assistant_reply":"הכול טוב! איך אפשר לעזור?"}
`;

function safeParseLlmJson(rawText: string) {
  try {
    const parsedJson = JSON.parse(rawText);
    return llmResponseSchema.safeParse(parsedJson);
  } catch {
    return { success: false } as const;
  }
}

export const ChatService = {
  async sendMessage(message: string, conversationId: string): Promise<ChatResponse> {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      previous_response_id: ConversationRepository.getLastResponseId(conversationId),
      temperature: 0.2,
      max_output_tokens: 320,
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "chat_intent_response",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              intent: {
                type: "string",
                enum: ["constraint", "schedule_query", "general", "out_of_scope"],
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
              },
              assistant_reply: {
                type: "string",
              },
              data: {
                type: "object",
                additionalProperties: false,
                properties: {
                  start_time: { type: "string" },
                  end_time: { type: "string" },
                  type: { type: "string", enum: ["HARD", "SOFT"] },
                },
                required: ["start_time", "end_time", "type"],
              },
            },
            required: ["intent", "confidence", "assistant_reply"],
          },
        },
      },
    });

    ConversationRepository.setLastResponseId(conversationId, response.id);

    const parsed = safeParseLlmJson(response.output_text);

    if (!parsed.success) {
      return {
        id: response.id,
        output_text: response.output_text,
        intent: "general",
      };
    }

    const parsedValue = parsed.data;

    return {
      id: response.id,
      output_text: parsedValue.assistant_reply,
      intent: parsedValue.intent,
      confidence: parsedValue.confidence,
      data: parsedValue.intent === "constraint" ? parsedValue.data : undefined,
    };
  },
};
