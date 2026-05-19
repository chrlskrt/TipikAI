"use client";

import * as React from "react";
import { saveMessage } from "@/lib/api";

interface ChatUser {
    id?: string;
    name?: string;
    email?: string;
}

interface ChatInterfaceProps {
    chatId?: string;
    onMessage?: () => void;
    onChatIdEstablished?: (chatId: string) => void;
    initialMessages?: any[];
    user?: ChatUser;
}

export function ChatInterface({ chatId, onMessage, onChatIdEstablished, initialMessages = [], user }: ChatInterfaceProps) {
    const chatContainerRef = React.useRef<HTMLDivElement>(null);
    const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_CHAT_URL;
    const [lastInitializedChatId, setLastInitializedChatId] = React.useState<string | undefined>(undefined);
    const [lastMessagesCount, setLastMessagesCount] = React.useState(0);
    const activeSessionIdRef = React.useRef<string | undefined>(chatId);

    React.useEffect(() => {
        if (!n8nWebhookUrl || !chatContainerRef.current) return;
        
        const currentMessagesCount = initialMessages?.length || 0;

        // Only re-initialize if:
        // 1. chatId has changed (selecting a different chat)
        // 2. We were at 0 messages and now we have history (history loading finished)
        // 3. We are resetting (New Wizard)
        
        if (chatId === lastInitializedChatId && 
            currentMessagesCount === lastMessagesCount && 
            lastInitializedChatId !== undefined) {
            return;
        }

        // If prop matches our active session (which we just created inside), 
        // AND we haven't suddenly loaded new history from outside, DON'T re-init.
        if (chatId && chatId === activeSessionIdRef.current && currentMessagesCount === lastMessagesCount) {
             return;
        }
        
        console.log('[ChatInterface] Initializing. ChatId:', chatId, 'History count:', currentMessagesCount);
        
        // Track state to prevent loops
        setLastInitializedChatId(chatId);
        setLastMessagesCount(currentMessagesCount);
        if (chatId) activeSessionIdRef.current = chatId;

        // Clear the container to allow re-initialization
        chatContainerRef.current.innerHTML = '';

        // Prepare initial messages for the widget
        const historyStrings = (initialMessages && initialMessages.length > 0)
            ? initialMessages.map(m => {
                const text = typeof m.content === 'string' 
                    ? m.content 
                    : (m.content?.text || m.content?.chatInput || JSON.stringify(m.content));
                return text;
            })
            : [
                'Hi there! 👋',
                "I'm here to help you create a custom machine learning model step by step. No coding required! 🚀",
                "To get started, tell me: What would you like your model to predict?"
            ];

        // Generate dynamic CSS to style user messages in history correctly
        // Since n8n widget treats all initialMessages as "bot" messages, 
        // we target them by their position in the list.
        const dynamicHistoryStyles = (initialMessages || []).map((m, i) => {
            const isUser = m.is_user || m.isUser;
            if (isUser) {
                // nth-child targets the message container. 
                // We apply "user" alignment and strip bot styling.
                const index = i + 1;
                return `
                    #n8n-chat [class*="MessagesList"] > div:nth-child(${index}),
                    #n8n-chat .chat-messages-list > div:nth-child(${index}) {
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: flex-end !important;
                        width: 100% !important;
                    }
                    #n8n-chat [class*="MessagesList"] > div:nth-child(${index}) [class*="message"],
                    #n8n-chat .chat-messages-list > div:nth-child(${index}) .message {
                        background: transparent !important;
                        border: none !important;
                        box-shadow: none !important;
                        padding: 0.25rem 0 !important;
                        text-align: right !important;
                        color: hsl(var(--muted-foreground)) !important;
                        font-weight: 500 !important;
                        margin-left: auto !important;
                        margin-right: 0 !important;
                    }
                `;
            }
            return '';
        }).join('\n');
        
        // Inject dynamic styles
        let styleTag = document.getElementById('n8n-history-styles');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'n8n-history-styles';
            document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = dynamicHistoryStyles;

        // Dynamically import n8n chat to avoid SSR issues
        import('@n8n/chat').then(({ createChat }) => {
            // Get auth token from localStorage
            const authToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            
            // Track the actual sessionId from n8n
            let n8nSessionId: string | null = null;
            
            // Initialize n8n chat widget
            createChat({
                webhookUrl: n8nWebhookUrl,
                webhookConfig: {
                    method: 'POST',
                    headers: {
                        // Pass authentication token to n8n
                        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
                    },
                    // Attempt to pass a long timeout (some wrappers support this)
                    timeout: 300000 // 5 minutes
                },
                target: chatContainerRef.current!,
                mode: 'fullscreen',
                chatInputKey: 'chatInput',
                chatSessionKey: 'sessionId',
                loadPreviousSession: false,
                initialMessages: historyStrings as any,
                metadata: {
                    ...(chatId && { chatId }),
                    ...(user?.id && { userId: user.id }),
                    ...(user?.name && { userName: user.name }),
                    ...(user?.email && { userEmail: user.email }),
                },
                beforeSubmit: async (data: any) => {
                    // Get the sessionId from n8n (this is the chat ID)
                    const sessionId = data.sessionId || n8nSessionId;
                    
                    console.log('[ChatInterface] Before submit:', { sessionId, chatInput: data.chatInput });
                    
                    if (sessionId) {
                        // If this is the first time we see this sessionId and we don't have a chatId prop,
                        // notify the parent so it can "adopt" this session as the current chat.
                        if (!chatId && onChatIdEstablished) {
                            console.log('[ChatInterface] Notifying parent of established chatId:', sessionId);
                            activeSessionIdRef.current = sessionId; // Update ref to prevent re-init on prop change
                            onChatIdEstablished(sessionId);
                        }
                        
                        if (data.chatInput) {
                            try {
                                const result = await saveMessage(sessionId, true, data.chatInput, user?.id);
                                console.log('[ChatInterface] User message saved successfully:', result.id);
                                if (onMessage) onMessage();
                            } catch (err: any) {
                                console.warn('[ChatInterface] Failed to save user message:', err.message);
                            }
                        }
                    }
                    
                    // Store sessionId for future use
                    n8nSessionId = data.sessionId;
                    
                    return data;
                },
                showWelcomeScreen: false,
                defaultLanguage: 'en',
                onResponseReceived: async (response: any) => {
                    console.log('[ChatInterface] onResponseReceived from n8n:', response);
                    
                    // Use the tracked sessionId (same as chatId)
                    const sessionId = n8nSessionId;
                    
                    if (sessionId) {
                        try {
                            // Extract text content from n8n response if it's in standard chatbot format (e.g. [{ output: \"...\" }])
                            let contentToSave = response;
                            if (Array.isArray(response) && response.length > 0) {
                                const firstItem = response[0];
                                // Check for common n8n output keys
                                contentToSave = firstItem.output || firstItem.text || firstItem.message || response;
                            } else if (typeof response === 'object' && response !== null) {
                                contentToSave = response.output || response.text || response.message || response;
                            }

                            // Ensure we have a string for the text part if it's still an object
                            const content = typeof contentToSave === 'string' ? contentToSave : JSON.stringify(contentToSave);
                            
                            console.log('[ChatInterface] Sending bot response to saveMessage:', { sessionId, extractedContent: content });
                            const result = await saveMessage(sessionId, false, content);
                            console.log('[ChatInterface] Bot response saved successfully:', result.id);
                            if (onMessage) onMessage();
                        } catch (err: any) {
                            console.error('[ChatInterface] Failed to save bot response:', {
                                sessionId,
                                error: err.message,
                                response: err.response?.data
                            });
                            if (onMessage) onMessage();
                        }
                    } else {
                        console.warn('[ChatInterface] Skipping bot saveMessage: sessionId missing', { sessionId });
                    }
                },
                onError: (error: any) => {
                    console.error('[ChatInterface] n8n widget error:', error);
                },
                i18n: {
                    en: {
                        title: 'TipikAI Assistant 🤖',
                        subtitle: "Let's build your custom ML model together!",
                        footer: '',
                        getStarted: 'Start New Conversation',
                        inputPlaceholder: 'Type your message...',
                        closeButtonTooltip: 'Close chat',
                    },
                },
                enableStreaming: false,
                theme: {
                    chatWindow: {
                        backgroundColor: 'hsl(var(--background))',
                        height: '100%',
                        width: '100%',
                    },
                    header: {
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        padding: '1.5rem',
                    },
                    messages: {
                        bot: {
                            backgroundColor: 'hsl(var(--muted) / 0.9)',
                            color: 'hsl(var(--foreground))',
                            borderRadius: '1.5rem',
                            padding: '0.5rem 1rem',
                            fontSize: '0.9375rem',
                            lineHeight: '1.5',
                        },
                        user: {
                            backgroundColor: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                            borderRadius: '1.5rem',
                            padding: '0.5rem 0.875rem',
                            fontSize: '0.875rem',
                            lineHeight: '1.4',
                        },
                    },
                    input: {
                        backgroundColor: 'hsl(var(--background))',
                        color: 'hsl(var(--foreground))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '0.75rem',
                        fontSize: '0.9375rem',
                        padding: '0.75rem 1rem',
                        placeholder: {
                            color: 'hsl(var(--muted-foreground))',
                        },
                    },
                    button: {
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                        borderRadius: '0.75rem',
                        fontSize: '0.9375rem',
                        padding: '0.625rem 1.25rem',
                        fontWeight: '500',
                    },
                },
            } as any);
            setLastInitializedChatId(chatId);
        }).catch(error => {
            console.error('Failed to load n8n chat:', error);
        });
    }, [n8nWebhookUrl, chatId, initialMessages, lastInitializedChatId]);

    if (!n8nWebhookUrl) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4 p-8">
                    <div className="text-destructive text-lg font-semibold">
                        Configuration Error
                    </div>
                    <p className="text-muted-foreground">
                        N8N chat URL is not configured. Please set NEXT_PUBLIC_N8N_CHAT_URL in your environment variables.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <style jsx global>{`
                /* N8N Chat CSS Variables - Premium TipikAI Design */
                :root {
                    --chat--color--primary: hsl(var(--primary));
                    --chat--color--primary-shade-50: hsl(var(--primary) / 0.9);
                    --chat--color--primary--shade-100: hsl(var(--primary) / 0.8);
                    --chat--color--secondary: hsl(var(--primary));
                    --chat--color-secondary-shade-50: hsl(var(--primary) / 0.9);
                    --chat--color-white: hsl(var(--background));
                    --chat--color-light: hsl(var(--muted));
                    --chat--color-light-shade-50: hsl(var(--muted) / 0.8);
                    --chat--color-light-shade-100: hsl(var(--muted) / 0.6);
                    --chat--color-medium: hsl(var(--border));
                    --chat--color-dark: hsl(var(--foreground));
                    --chat--color-disabled: hsl(var(--muted-foreground));
                    --chat--color-typing: hsl(var(--muted-foreground));

                    --chat--spacing: 1rem;
                    --chat--border-radius: 1.25rem;
                    --chat--transition-duration: 0.3s;

                    --chat--window--width: 100%;
                    --chat--window--height: 100%;

                    --chat--header-height: auto;
                    --chat--header--padding: 2rem;
                    --chat--header--background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.85) 100%);
                    --chat--header--color: hsl(var(--primary-foreground));
                    --chat--header--border-top: none;
                    --chat--header--border-bottom: 1px solid hsl(var(--border) / 0.3);
                    --chat--heading--font-size: 1.25rem;
                    --chat--subtitle--font-size: 0.9375rem;
                    --chat--subtitle--line-height: 1.6;

                    --chat--textarea--height: 56px;

                    --chat--message--font-size: 0.8rem;
                    --chat--message--padding: .5rem .5rem;
                    --chat--message--border-radius: 1.25rem;
                    --chat--message-line-height: 1.6;
                    --chat--message--bot--background: transparent;
                    --chat--message--bot--color: hsl(var(--foreground));
                    --chat--message--bot--border: none;
                    --chat--message--user--background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.9) 100%);
                    --chat--message--user--color: hsl(var(--primary-foreground));
                    --chat--message--user--border: none;
                    --chat--message--pre--background: hsl(var(--muted) / 0.5);

                    --chat--toggle--background: hsl(var(--primary));
                    --chat--toggle--hover--background: hsl(var(--primary) / 0.9);
                    --chat--toggle--active--background: hsl(var(--primary) / 0.8);
                    --chat--toggle--color: hsl(var(--primary-foreground));
                    --chat--toggle--size: 64px;
                }

                /* Main chat container - Fixed layout */
                #n8n-chat {
                    width: 100% !important;
                    height: 100% !important;
                    display: flex !important;
                    flex-direction: column !important;
                    position: relative !important;
                    overflow: hidden !important;
                }

                /* Paragraph styles - Allow block display in bot messages for proper formatting */
                #n8n-chat p {
                    margin: 0.5em 0 !important;
                    display: block !important;
                }
                
                /* Keep user message paragraphs inline for compactness */
                #n8n-chat .message.user p,
                #n8n-chat [class*="message"][class*="user"] p,
                #n8n-chat [class*="Message--user"] p {
                    margin: 0 !important;
                    display: inline !important;
                }

                /* Chat window styling */
                #n8n-chat > * {
                    width: 100% !important;
                    display: flex !important;
                    flex-direction: column !important;
                    max-width: none !important;
                    flex: 1 !important;
                    overflow: hidden !important;
                }

                /* Header with gradient and shadow */
                #n8n-chat .chat-header,
                #n8n-chat header {
                    background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.85) 100%) !important;
                    padding: .5rem !important;
                    border-bottom: 1px solid hsl(var(--border) / 0.3) !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
                    flex-shrink: 0 !important;
                    justify-content: center !important;
                }

                #n8n-chat .chat-header h1,
                #n8n-chat header h1 {
                    font-size: 1rem !important;
                    font-weight: 700 !important;
                    letter-spacing: -0.01em !important;
                    text-align: center !important;
                    color: hsl(var(--primary-foreground)) !important;
                    margin: 0 !important;
                }

                #n8n-chat .chat-header p:not(:empty),
                #n8n-chat header p:not(:empty) {
                    opacity: 0.8 !important;
                    margin-top: 0.25rem !important;
                    text-align: center !important;
                    color: hsl(var(--primary-foreground)) !important;
                }

                /* Messages container - Light background */
                #n8n-chat .messages,
                #n8n-chat [class*="messages"],
                #n8n-chat .chat-messages-list,
                #n8n-chat [class*="MessagesList"] {
                    flex: 1 !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    overflow-y: auto !important;
                    overflow-x: hidden !important;
                    padding: 1rem !important;
                    background: linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.1) 100%) !important;
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 0.5rem !important;
                }

                /* Message bubbles with glassmorphism */
                #n8n-chat .message,
                #n8n-chat [class*="message"] {
                    animation: slideIn 0.3s ease-out !important;
                    word-wrap: break-word !important;
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                #n8n-chat .chat-messages-list {
                    max-width: 100% !important;
                }

                /* Bot messages - Compact rounded bubble */
                #n8n-chat .message.bot,
                #n8n-chat [class*="message"][class*="bot"],
                #n8n-chat [class*="Message--bot"] {
                    background: hsl(var(--muted) / 0.9) !important;
                    backdrop-filter: blur(10px) !important;
                    border: none !important;
                    border-radius: 1.5rem 1.5rem 1.5rem 0.25rem !important;
                    padding: 0.625rem 1.125rem !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06) !important;
                    color: hsl(var(--foreground)) !important;
                    line-height: 1.5 !important;
                }

                /* Markdown List Styling - More compact */
                #n8n-chat .message.bot ul,
                #n8n-chat .message.bot ol {
                    margin: 0.5rem 0 0.5rem 0 !important;
                    padding-left: 1.5rem !important;
                    display: block !important;
                }

                #n8n-chat .message.bot ul li {
                    list-style-type: disc !important;
                    margin-bottom: 0.25rem !important;
                    display: list-item !important;
                }

                #n8n-chat .message.bot ol li {
                    list-style-type: decimal !important;
                    margin-bottom: 0.25rem !important;
                    display: list-item !important;
                }

                #n8n-chat .message.bot strong,
                #n8n-chat .message.bot b {
                    font-weight: 700 !important;
                    color: hsl(var(--foreground)) !important;
                }

                #n8n-chat .message.bot p {
                    margin-bottom: 0.5rem !important;
                }

                #n8n-chat .message.bot p:last-child {
                    margin-bottom: 0 !important;
                }

                #n8n-chat .message.bot code {
                    background: hsl(var(--muted)) !important;
                    padding: 0.2rem 0.4rem !important;
                    border-radius: 4px !important;
                    font-family: monospace !important;
                    font-size: 0.9em !important;
                }

                #n8n-chat .message.bot pre {
                    background: hsl(var(--muted) / 0.5) !important;
                    padding: 0.75rem !important;
                    border-radius: 0.75rem !important;
                    margin: 0.75rem 0 !important;
                    overflow-x: auto !important;
                }

                #n8n-chat .message.bot:hover,
                #n8n-chat [class*="message"][class*="bot"]:hover,
                #n8n-chat [class*="Message--bot"]:hover {
                    box-shadow: none !important;
                    transform: none !important;
                }

                /* User messages - Gradient with glow */
                /* User messages - Compact and right-aligned */
                /* User messages - Compact bubbles on the right */
                #n8n-chat .message.user,
                #n8n-chat [class*="message"][class*="user"],
                #n8n-chat [class*="Message--user"],
                #n8n-chat [class*="message-user"],
                #n8n-chat .chat-message-from-user,
                #n8n-chat [class*="user-msg"],
                #n8n-chat [class*="UserMsg"] {
                    background: transparent !important;
                    background-color: transparent !important;
                    border: none !important;
                    border-radius: 0 !important;
                    padding: 0.25rem 0 !important;
                    box-shadow: none !important;
                    margin-left: auto !important;
                    margin-right: 0 !important;
                    transition: none !important;
                    align-self: flex-end !important;
                    text-align: right !important;
                    max-width: 85% !important;
                    width: fit-content !important;
                    display: block !important;
                    flex: 0 0 auto !important;
                    color: hsl(var(--foreground)) !important;
                    float: right !important;
                    clear: both !important;
                    font-weight: 500 !important;
                    min-height: 0 !important;
                }

                #n8n-chat .message.user p,
                #n8n-chat [class*="message"][class*="user"] p,
                #n8n-chat [class*="Message--user"] p,
                #n8n-chat [class*="message-user"] p,
                #n8n-chat .chat-message-from-user p,
                #n8n-chat [class*="user-msg"] p {
                    margin: 0 !important;
                    display: inline !important;
                    color: inherit !important;
                    background: transparent !important;
                }

                #n8n-chat .message.user:hover,
                #n8n-chat [class*="message"][class*="user"]:hover,
                #n8n-chat [class*="Message--user"]:hover {
                    box-shadow: 0 6px 20px hsl(var(--primary) / 0.35),
                                0 3px 6px hsl(var(--primary) / 0.2) !important;
                    transform: translateY(-1px) !important;
                }

                #n8n-chat .chat-body {
                    flex: 1 !important;
                    width: 100% !important;
                    overflow-y: auto !important;
                    display: flex !important;
                    flex-direction: column !important;
                }

                /* Input container - Light background */
                #n8n-chat .chat-input,
                #n8n-chat [class*="input"],
                #n8n-chat form,
                #n8n-chat [class*="InputWrapper"],
                #n8n-chat [class*="ChatInput"] {
                    flex-shrink: 0 !important;
                    background: hsl(var(--background)) !important;
                    border-top: 1px solid hsl(var(--border) / 0.3) !important;
                    position: sticky !important;
                    bottom: 0 !important;
                    z-index: 10 !important;
                    display: flex !important;
                    flex-direction: row !important;
                    align-items: center !important;
                    gap: 1rem !important;
                    padding: 1rem 2rem !important;
                    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.04) !important;
                }

                #n8n-chat .chat-input {
                    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.04) !important;
                }

                #n8n-chat .chat-inputs {
                    flex: 1;
                    padding: .5rem !important;
                }

                /* Input field styling */
                #n8n-chat input[type="text"],
                #n8n-chat textarea {
                    background: hsl(var(--background)) !important;
                    border: 2px solid hsl(var(--border)) !important;
                    border-radius: 0.75rem !important;
                    padding: 0.75rem 1rem !important;
                    font-size: 0.9375rem !important;
                    color: hsl(var(--foreground)) !important;
                    transition: all 0.2s ease !important;
                    height: auto !important;
                    min-height: 44px !important;
                    max-height: 250px !important;
                    resize: none !important;
                    flex: 1 !important;
                    line-height: 1.5 !important;
                }

                #n8n-chat input[type="text"]:focus,
                #n8n-chat textarea:focus {
                    outline: none !important;
                    border-color: hsl(var(--primary)) !important;
                    box-shadow: 0 0 0 4px hsl(var(--primary) / 0.1) !important;
                    background: hsl(var(--background)) !important;
                }

                /* Send button styling */
                #n8n-chat button[type="submit"],
                #n8n-chat .send-button,
                #n8n-chat [class*="SendButton"] {
                    background: hsl(var(--primary)) !important;
                    color: hsl(var(--primary-foreground)) !important;
                    border: none !important;
                    border-radius: 0.75rem !important;
                    padding: 0.75rem 1.5rem !important;
                    font-weight: 600 !important;
                    transition: all 0.3s ease !important;
                    height: 44px !important;
                    flex-shrink: 0 !important;
                    white-space: nowrap !important;
                }

                #n8n-chat button[type="submit"]:hover,
                #n8n-chat .send-button:hover,
                #n8n-chat [class*="SendButton"]:hover {
                    transform: translateY(-1px) !important;
                    box-shadow: 0 4px 12px hsl(var(--primary) / 0.3) !important;
                }

                #n8n-chat button[type="submit"]:active,
                #n8n-chat .send-button:active,
                #n8n-chat [class*="SendButton"]:active {
                    transform: translateY(0) !important;
                }


                /* Typing indicator animation */
                #n8n-chat .typing-indicator,
                #n8n-chat [class*="typing"] {
                    display: flex !important;
                    gap: 0.375rem !important;
                    padding: 1rem 1.25rem !important;
                    background: hsl(var(--muted) / 0.6) !important;
                    backdrop-filter: blur(12px) !important;
                    border-radius: 1.25rem !important;
                    width: fit-content !important;
                }

                #n8n-chat .typing-indicator span,
                #n8n-chat [class*="typing"] span {
                    width: 8px !important;
                    height: 8px !important;
                    background: hsl(var(--muted-foreground)) !important;
                    border-radius: 50% !important;
                    animation: typingBounce 1.4s ease-in-out infinite !important;
                }

                #n8n-chat .typing-indicator span:nth-child(2),
                #n8n-chat [class*="typing"] span:nth-child(2) {
                    animation-delay: 0.2s !important;
                }

                #n8n-chat .typing-indicator span:nth-child(3),
                #n8n-chat [class*="typing"] span:nth-child(3) {
                    animation-delay: 0.4s !important;
                }

                @keyframes typingBounce {
                    0%, 60%, 100% {
                        transform: translateY(0);
                    }
                    30% {
                        transform: translateY(-10px);
                    }
                }
                
                /* Hide scrollbar for all elements but keep scrolling functional */
                #n8n-chat *,
                #n8n-chat {
                    scrollbar-width: none !important; /* Firefox */
                    -ms-overflow-style: none !important; /* IE and Edge */
                }

                #n8n-chat *::-webkit-scrollbar {
                    display: none !important; /* Chrome, Safari and Opera */
                    width: 0 !important;
                    height: 0 !important;
                }

                /* Remove default borders and shadows */
                #n8n-chat .chat-window {
                    border-radius: 0 !important;
                    box-shadow: none !important;
                }

                /* Smooth transitions for all interactive elements */
                #n8n-chat * {
                    transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform !important;
                    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
                }

                /* Welcome screen styling if shown */
                #n8n-chat .welcome-screen,
                #n8n-chat [class*="Welcome"] {
                    background: linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.2) 100%) !important;
                    padding: 3rem !important;
                    border-radius: 1.5rem !important;
                }

                /* Link styling within messages */
                #n8n-chat a {
                    color: hsl(var(--primary)) !important;
                    text-decoration: underline !important;
                    text-decoration-color: hsl(var(--primary) / 0.3) !important;
                    transition: all 0.2s ease !important;
                }

                #n8n-chat a:hover {
                    text-decoration-color: hsl(var(--primary)) !important;
                    opacity: 0.8 !important;
                }

                /* Hide n8n chat error messages as requested by user */
                #n8n-chat .chat-error,
                #n8n-chat [class*="error"],
                #n8n-chat [class*="Error"],
                #n8n-chat .n8n-chat-error {
                    display: none !important;
                    visibility: hidden !important;
                    pointer-events: none !important;
                    opacity: 0 !important;
                    height: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }

                #n8n-chat .chat-header {
                    text-align: center !important;
                }

                #n8n-chat p {
                    margin-right:    .5rem !important;
                    margin-left:     .5rem !important;
                    width: fit-content !important;
                }

                #n8n-chat .chat-message-from-bot,
                #n8n-chat .chat-message-from-user {
                    width: fit-content !important;
                    max-width: 75% !important;
                }
            `}</style>
            <div ref={chatContainerRef} className="relative w-full h-full" id="n8n-chat" />
        </>
    );
}
