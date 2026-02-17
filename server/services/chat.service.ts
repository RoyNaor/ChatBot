import dotenv from 'dotenv';
import OpenAI from 'openai';
import { ConversationRepository } from '../repositories/conversation.repository';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

const openai = apiKey
  ? new OpenAI({
      apiKey,
    })
  : null;

interface ChatResponse {
  id: string;
  output_text: string;
}

export const ChatService = {
  async sendMessage(message: string, conversationId: string): Promise<ChatResponse> {
    if (!openai) {
      throw new Error('OPENAI_API_KEY is not configured.');
    }

    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: message,
      temperature: 0.5,
      max_output_tokens: 100,
      previous_response_id: ConversationRepository.getLastResponseId(conversationId),
    });

    ConversationRepository.setLastResponseId(conversationId, response.id);

    return {
      id: response.id,
      output_text: response.output_text || 'No response content was returned.',
    };
  },
};
