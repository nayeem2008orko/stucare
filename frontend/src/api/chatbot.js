import api from './client';

export const chatbotApi = {
  sendMessage: (message, mode) =>
    api.post('/chatbot/message', { message, mode }),
};