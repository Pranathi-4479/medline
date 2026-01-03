import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, Minimize2, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: "AIzaSyC-7puBvmt31FCZB9d_fpbs6viAZmw_uIY" });

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const MEDIBOT_SYSTEM_INSTRUCTION = `
You are MediBot, the intelligent AI assistant for MediLink, a medicine donation platform.
Your goal is to help Donors, NGOs, Delivery Agents, and Admins.

KEY PLATFORM RULES:
1. Donations: 
   - Users can donate unused medicine.
   - Sealed/Valid Medicine -> Routed to NGOs -> Reward: 50 Coins.
   - Opened/Expired Medicine -> Routed to Bio-Labs for disposal -> Reward: 2 Coins.
2. Rewards & Gamification:
   - Wallet Balance is shown in coins.
   - 1000 Coins Milestone: User gets a "First Aid Kit" bonus from Admin.
   - Coins can be used by Donors to request essential medicines (Insulin, etc.).
3. Logistics:
   - Pickup Code: A 4-digit security code generated for donors. Must be given to the Delivery Agent to verify pickup.
   - Live Tracking: Available for Donors, NGOs, and Admins.
4. Emergency Protocol:
   - If Admin triggers "Disaster Alert" (Red Banner), all coin rewards are DOUBLED (2x).
   - Donors should prioritize medicines listed in the alert.

ROLES:
- Donor: Donates meds, earns coins, requests supplies.
- NGO: Verifies stock, distributes to patients, requests bulk supplies.
- Delivery Agent: Picks up using code, delivers to destination.
- Admin: Approves users, manages inventory, triggers emergency alerts.

TONE:
- Professional, empathetic, helpful, and concise. 
- If asked about medical advice, clarify you are a platform assistant, not a doctor.
`;

const MediBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm MediBot 🤖 powered by Gemini AI. I can answer anything about donations, rewards, or tracking. How can I help?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    // 1. Add User Message
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // 2. Construct History for Context
      // Map existing messages to Gemini format (limit to last 10 for efficiency)
      const history = messages.slice(-10).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      // Add current message
      history.push({ role: 'user', parts: [{ text: newUserMsg.text }] });

      // 3. Call Gemini API
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: history,
        config: {
          systemInstruction: MEDIBOT_SYSTEM_INSTRUCTION,
        }
      });

      const botText = response.text || "I'm having trouble connecting to my brain right now. Please try again.";

      // 4. Add Bot Response
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);

    } catch (error) {
      console.error("Gemini Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please check your connection.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 bg-teal-600 text-white rounded-full shadow-xl hover:bg-teal-700 transition-all transform hover:scale-105 active:scale-95 ${isOpen ? 'hidden' : 'flex items-center justify-center'}`}
      >
        <MessageSquare size={26} />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 z-50 w-[90vw] md:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`} style={{ maxHeight: '600px', height: '70vh' }}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-4 text-white flex justify-between items-center shadow-md">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm border border-white/30">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-1">
                MediBot <Sparkles size={12} className="text-yellow-300" />
              </h3>
              <p className="text-[10px] text-teal-100 font-semibold uppercase tracking-wider">
                Powered by Gemini
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-lg transition">
            <Minimize2 size={18} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          <div className="text-center text-xs text-gray-400 my-2">Today</div>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-teal-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          
          {isTyping && (
             <div className="flex justify-start">
               <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex space-x-2 items-center">
                 <Loader2 size={16} className="text-teal-600 animate-spin" />
                 <span className="text-xs text-gray-500 font-medium">MediBot is thinking...</span>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 bg-gray-100 text-gray-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all placeholder-gray-400"
          />
          <button 
            type="submit" 
            disabled={!inputText.trim() || isTyping} 
            className="p-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
};

export default MediBot;