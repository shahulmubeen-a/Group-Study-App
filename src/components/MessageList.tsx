import React from 'react';
import { Message, UserProfile } from '../types';

interface MessageListProps {
  messages: Message[];
  currentUser: string;
  userProfiles: Record<string, UserProfile>;
}

export function MessageList({ messages, currentUser, userProfiles }: MessageListProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const isSystemMessage = (message: Message) => {
    return message.sender === 'system';
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#313338]">
      {messages.map((message) => {
        if (isSystemMessage(message)) {
          return (
            <div key={message.id} className="flex justify-center">
              <div 
                className="bg-[#2B2D31] text-[#B9BBBE] px-4 py-2 rounded-lg text-sm"
                dangerouslySetInnerHTML={{ __html: message.text }}
              />
            </div>
          );
        }

        const isOwn = message.sender === currentUser;
        const userProfile = userProfiles[message.sender];
        const displayName = userProfile?.name || message.sender.split('@')[0] || 'Unknown User';

        return (
          <div
            key={message.id}
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 message-bubble ${
                isOwn ? 'own' : ''
              }`}
            >
              <div className={`text-sm font-semibold mb-1 ${
                isOwn ? 'text-white' : 'text-[#5865F2]'
              }`}>
                {displayName}
              </div>
              <div className="break-words">{message.text}</div>
              <div className={`text-xs mt-1 opacity-70 ${
                isOwn ? 'text-right' : 'text-left'
              }`}>
                {formatTime(message.created_at)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}