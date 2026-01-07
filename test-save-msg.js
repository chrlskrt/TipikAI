
const axios = require('axios');

const API_URL = 'http://localhost:8000';
const CHAT_ID = 'your-chat-uuid-here'; // I'll search for one or create one

async function testSaveMessage() {
    try {
        console.log('Fetching existing chats...');
        const chatsRes = await axios.get(`${API_URL}/chat`);
        const chats = chatsRes.data.data;
        
        if (chats.length === 0) {
            console.log('No chats found. Creating one...');
            const newChatRes = await axios.post(`${API_URL}/chat`, { title: 'Test Chat' });
            chats.push(newChatRes.data.data);
        }
        
        const chatId = chats[0].id;
        console.log(`Using chatId: ${chatId}`);
        
        console.log('Saving test message...');
        const res = await axios.post(`${API_URL}/chat/${chatId}/message`, {
            isUser: true,
            content: { text: 'Test message from script' }
        });
        
        console.log('Success!', res.data);
        
        console.log('Verifying messages...');
        const messagesRes = await axios.get(`${API_URL}/chat/${chatId}/message`);
        console.log('Messages in DB:', messagesRes.data.data.length);
        console.log('Last message:', messagesRes.data.data[messagesRes.data.data.length - 1]);
        
    } catch (error) {
        console.error('Failed:', error.response ? error.response.data : error.message);
    }
}

testSaveMessage();
