const conversations = new Map<string, string>();

export const ConversationRepository = {

  getLastResponseId(conversationId: string): string | undefined {
  return conversations.get(conversationId) || undefined;
  },
  
  setLastResponseId(conversationId: string, responseId: string): void {
    conversations.set(conversationId, responseId);
  }

}
