import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { openai, getSystemPrompt } from '../config/openai';
import { StreakDisplay } from './StreakDisplay';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isSpeaking?: boolean;
  imageUrl?: string;
  id: string;
  isLoading: boolean;
}

export default function AIConversation() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isVoiceOverlayVisible, setIsVoiceOverlayVisible] = useState(false);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started.');
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        console.log('Speech recognition result received.', event);
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript.trim()) {
          console.log('Final Transcript:', finalTranscript);
          // Set input for visual feedback temporarily (optional, could skip this)
          setInput(finalTranscript);
          // Automatically send message using the final transcript
          console.log('Calling handleSendMessage(true) with finalTranscript from onresult');
          handleSendMessage(true, finalTranscript);
          // Clear input field after sending (optional, could skip this)
          setInput('');
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        // If a severe error occurs, stop the voice chat
        if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'not-allowed') {
          console.error('Severe speech recognition error, stopping voice chat.', event.error);
          stopVoiceChat(); // Use the helper function to clean up
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended.');
        // If the overlay is visible and recognition ended unexpectedly, log it.
        if (isVoiceOverlayVisible) {
          console.log('Speech recognition ended unexpectedly while voice overlay is visible.');
          // We might need to add logic here to attempt to restart recognition
          // or inform the user that the voice session has ended unexpectedly.
        }
        setIsListening(false);
      };
    } else {
      console.warn('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speakMessage = async (message: Message) => {
    if (!message.content) return;
    setIsSpeakingAudio(true);
    setMessages(prev => prev.map(msg => msg.id === message.id ? { ...msg, isSpeaking: true } : msg));

    try {
      console.log('Calling OpenAI TTS API for message:', message.content);
      const response = await openai.audio.speech.create({
        model: "tts-1", // or "tts-1-hd"
        voice: "nova", // Choose a voice (alloy, echo, fable, onyx, nova, shimmer)
        input: message.content,
      });

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);

      audio.onended = () => {
        console.log('OpenAI audio playback ended.');
        setIsSpeakingAudio(false);
        setMessages(prev => prev.map(msg => msg.id === message.id ? { ...msg, isSpeaking: false } : msg));
        URL.revokeObjectURL(audioUrl); // Clean up the object URL

        // In continuous voice mode, restart listening after AI finishes speaking
        if (isVoiceOverlayVisible && recognitionRef.current) {
            console.log('AI finished speaking (OpenAI TTS), attempting to restart speech recognition.');
             // Attempt to restart recognition. A small delay might be beneficial.
             setTimeout(() => {
                try {
                    recognitionRef.current.start();
                    setIsListening(true); // Update state
                    console.log('Speech recognition restarted after AI speech.');
                } catch (error) {
                    console.error('Error restarting speech recognition after AI speech:', error);
                    // Handle potential errors if recognition fails to restart
                    // e.g., inform user, stop voice chat mode
                }
             }, 500); // Small delay
        }
      };

      audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setIsSpeakingAudio(false);
          setMessages(prev => prev.map(msg => msg.id === message.id ? { ...msg, isSpeaking: false } : msg));
          URL.revokeObjectURL(audioUrl); // Clean up the object URL
      };

      audio.play().catch(error => {
          console.error('Error playing audio:', error);
          setIsSpeakingAudio(false);
          setMessages(prev => prev.map(msg => msg.id === message.id ? { ...msg, isSpeaking: false } : msg));
          URL.revokeObjectURL(audioUrl); // Clean up the object URL
      });

    } catch (error) {
      console.error('Error calling OpenAI TTS API:', error);
      setIsSpeakingAudio(false);
      setMessages(prev => prev.map(msg => msg.id === message.id ? { ...msg, isSpeaking: false } : msg));
      // Optionally, fallback to browser TTS or display an error message
      console.log('Falling back to browser TTS due to API error.');
       // Fallback to browser TTS (optional)
       if ('speechSynthesis' in window) {
            const fallbackUtterance = new SpeechSynthesisUtterance(message.content);
            fallbackUtterance.lang = 'en-US'; // Or the appropriate language
             // Set fallback voice if needed, similar to old init logic
            window.speechSynthesis.speak(fallbackUtterance);
             // Note: Browser TTS onend would need separate handling if continuous mic restart is needed here
       }
    }
  };

  const generateImage = async (prompt: string) => {
    setIsGeneratingImage(true);
    try {
      console.log('Attempting image generation with prompt:', prompt);
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: `create an image for ${prompt}`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural"
      });

      console.log('OpenAI Image Generation Response:', response);

      if (!response.data || response.data.length === 0) {
        console.error('Error: No image data in response', response);
        throw new Error('No image data in response');
      }

      const imageUrl = response.data[0].url;
      if (!imageUrl) {
        console.error('Error: No image URL in response', response.data);
        throw new Error('No image URL in response');
      }

      console.log('Successfully generated image with URL:', imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('Error during image generation API call:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      // If image generation failed in the try block, generate a text response instead
      // The generateImage function now returns null on failure instead of throwing
      console.log('Image generation failed, attempting text response instead.');
      return undefined; // Indicate failure by returning undefined
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Function to stop both speech recognition and synthesis
  const stopVoiceChat = () => {
    console.log('Stopping voice chat manually.');
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsVoiceOverlayVisible(false);
    setIsListening(false); // Ensure listening state is false on stop
  };

  const handleSendMessage = async (fromVoice: boolean = false, messageContent?: string) => {
    const messageToSend = messageContent || input.trim();
    if (!messageToSend || !user) {
      console.log('handleSendMessage: Message content empty or user not logged in. Returning.');
      return;
    }

    console.log('handleSendMessage: Sending message.', { fromVoice, messageToSend, user });

    // Add user message and AI placeholder in one go for atomic update
    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
      id: Date.now().toString(),
      isLoading: false // User messages are not loading
    };

    const aiPlaceholderId = Date.now().toString() + '_ai'; // Unique ID for AI placeholder
    const aiPlaceholder: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      id: aiPlaceholderId,
      isLoading: true // Indicate that this message is currently loading
    };

    setMessages(prev => [...prev, userMessage, aiPlaceholder]); // Add both messages atomically
    // Clear input unless it was from voice, which is handled in onresult
    if (!fromVoice) {
      setInput('');
    }

    setIsProcessing(true);

    // If initiated by voice, show the overlay
    if (fromVoice) {
      setIsVoiceOverlayVisible(true);
    }

    try {
      const systemPrompt = getSystemPrompt(user.email || '');

      // Check if this is an image request
      const imageRequestPhrases = [
        'show me', 'generate', 'create', 'make', 'draw', 'picture', 'image', 'photo',
        'illustration', 'visual', 'art', 'painting', 'sketch'
      ];
      
      const isImageRequest = imageRequestPhrases.some(phrase => 
        messageToSend.toLowerCase().includes(phrase)
      );

      console.log('Message analysis:', {
        message: messageToSend,
        isImageRequest,
        matchedPhrases: imageRequestPhrases.filter(phrase => 
          messageToSend.toLowerCase().includes(phrase)
        )
      });

      let imageUrl: string | undefined;
      let aiResponse;

      if (isImageRequest) {
        console.log('Detected image request:', messageToSend);
        // The generateImage function now returns undefined on failure
        imageUrl = await generateImage(messageToSend);

        console.log('Image generation result:', {
          success: !!imageUrl,
          imageUrl,
          message: messageToSend
        });

        if (imageUrl) {
           aiResponse = "Here's an image I created for you! Let me know if you'd like to learn more about this topic.";
        } else {
           // If image generation failed, get a text response instead
           console.log('Image generation failed, falling back to text response');
           aiResponse = await getAiTextResponse(messageToSend, systemPrompt, aiPlaceholderId);
        }
      } else {
        // Regular conversation
        console.log('Not an image request, getting text response');
        aiResponse = await getAiTextResponse(messageToSend, systemPrompt, aiPlaceholderId); // Get text response
      }

      const aiMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        imageUrl,
        id: aiPlaceholderId, // Use the same ID as the placeholder
        isLoading: false // Mark as no longer loading
      };

      // Replace the placeholder with the actual message
      setMessages(prev => prev.map(msg => msg.id === aiPlaceholderId ? aiMessage : msg));

      // Only speak if the user's input was from voice
      if (fromVoice) {
        // Delay speaking slightly to allow UI to update
        setTimeout(() => {
          speakMessage(aiMessage);
        }, 100);
      }

      // If not in voice mode, hide the overlay (this case should be handled by stopVoiceChat now)
      // Keeping this here as a fallback, but ideally stopVoiceChat is the exit
      if (!fromVoice) {
        setIsVoiceOverlayVisible(false);
      }
    } catch (error) {
      console.error('Error in message handling:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
        id: aiPlaceholderId, // Use the same ID as the placeholder
        isLoading: false // Mark as not loading
      };
      // Replace the placeholder with the error message
      setMessages(prev => prev.map(msg => msg.id === aiPlaceholderId ? errorMessage : msg));
      // Hide overlay on error, or perhaps show an error state within overlay
      setIsVoiceOverlayVisible(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to get text response from AI
  const getAiTextResponse = async (message: string, systemPrompt: string, aiPlaceholderId: string) => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          // Include previous messages for context, excluding placeholder
          ...messages
            .filter(msg => msg.id !== aiPlaceholderId && !msg.isLoading) // Exclude the current placeholder and any other loading messages
             .map(msg => ({
               role: msg.role,
               content: msg.content
             })),
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0].message.content || 'I apologize, but I could not generate a response.';
    } catch (error) {
      console.error('Error getting AI text response:', error);
      return 'I apologize, but I encountered an error getting a text response.';
    }
  };

  const toggleListening = () => {
    console.log('toggleListening called. Current isListening:', isListening, 'Current isVoiceOverlayVisible:', isVoiceOverlayVisible);
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      console.log('toggleListening: Stopping listening.');
      recognitionRef.current.stop();
    } else {
      console.log('toggleListening: Starting listening.');
      setInput('');
      setIsListening(true);
      // Add a small delay before starting recognition
      console.log('Setting timeout to start recognition...');
      setTimeout(() => {
        console.log('Attempting to start recognition after delay...');
        try {
          recognitionRef.current.start();
          console.log('recognitionRef.current.start() called.');
        } catch (error) {
          console.error('Error starting speech recognition after delay:', error);
          setIsListening(false);
          setIsVoiceOverlayVisible(false); // Hide overlay on error
        }
      }, 300); // Increased delay to 300ms
      // Show the voice overlay when starting listening
      setIsVoiceOverlayVisible(true);
    }
  };

  return (
    <div className="conversation-container">
      <StreakDisplay />
      <div className="flex flex-col h-full bg-gray-50">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 shadow-md'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    {message.isLoading ? (
                      // Placeholder or typing indicator
                      <div className="flex items-center">
                        <div className="dot-spinner">
                          <div className="dot-spinner__dot"></div>
                          <div className="dot-spinner__dot"></div>
                          <div className="dot-spinner__dot"></div>
                          <div className="dot-spinner__dot"></div>
                          <div className="dot-spinner__dot"></div>
                          <div className="dot-spinner__dot"></div>
                          <div className="dot-spinner__dot"></div>
                          <div className="dot-spinner__dot"></div>
                        </div>
                        <span className="ml-2 text-gray-500">Thinking...</span>
                      </div>
                    ) : (
                      // Display actual message content
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                    {message.imageUrl && (
                      <div className="mt-4">
                        <img 
                          src={message.imageUrl} 
                          alt="Generated illustration" 
                          className="rounded-lg max-w-full h-auto shadow-md"
                        />
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.role === 'assistant' && (
                        <button
                          onClick={() => speakMessage(message)}
                          className={`ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors ${
                            message.isSpeaking ? 'text-blue-500' : 'text-gray-400'
                          }`}
                          title={message.isSpeaking ? 'Speaking...' : 'Speak message'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.728" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Overlay */}
        {isVoiceOverlayVisible && (
          <div className="voice-overlay fixed inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center text-white z-50">
            {/* We can add cool effects or animations here later */}
            <div className="dot-spinner mb-4">
               <div className="dot-spinner__dot"></div>
               <div className="dot-spinner__dot"></div>
               <div className="dot-spinner__dot"></div>
               <div className="dot-spinner__dot"></div>
               <div className="dot-spinner__dot"></div>
               <div className="dot-spinner__dot"></div>
               <div className="dot-spinner__dot"></div>
               <div className="dot-spinner__dot"></div>
             </div>
             <p className="text-xl">
               {isListening ? (
                 'Listening...' // While user is speaking
               ) : isSpeakingAudio ? (
                 'Yapping...' // While AI is speaking audio
               ) : isProcessing ? (
                 'Thinking...' // While waiting for AI response
               ) : (
                 // Check if the AI's last message (if any) is currently speaking
                 messages.length > 0 && messages[messages.length - 1].isSpeaking ?
                 'Yapping...' : // While AI is speaking
                 'Yapping... Speak Now!' // AI is done, waiting for user
               )}
             </p>
              {/* Add a stop button here later */}
              <button
                onClick={stopVoiceChat}
                className="mt-8 px-6 py-2 border border-white rounded-full text-white hover:bg-white hover:text-gray-900 transition-colors"
              >
                Stop Yapping
              </button>
            </div>
          )}

        {/* Input Area */}
        <div className="border-t bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-2">
              <button
                onClick={toggleListening}
                className={`p-2 rounded-full transition-colors duration-200 ${isListening ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(false)}
                placeholder={isListening ? "Listening..." : "Type your message..."}
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing || isGeneratingImage}
              />
              <button
                onClick={() => handleSendMessage(false)}
                disabled={isProcessing || isGeneratingImage || !input.trim()}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {isGeneratingImage ? 'Generating Image...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add CSS for a simple typing indicator (dot spinner)
const style = document.createElement('style');
style.innerHTML = `
.dot-spinner {
  --uib-size: 2.8rem;
  --uib-speed: .9s;
  --uib-color: #3b82f6;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: var(--uib-size);
  width: var(--uib-size);
}

.dot-spinner__dot {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 100%;
  width: 100%;
}

.dot-spinner__dot::before {
  content: '';
  height: 15%;
  width: 15%;
  border-radius: 50%;
  background-color: var(--uib-color);
  transform: scale(0);
  opacity: 0.5;
  animation: pulse0112 calc(var(--uib-speed) * 1.111) ease-in-out infinite;
  will-change: transform, opacity;
}

.dot-spinner__dot:nth-child(2) {
  transform: rotate(45deg);
}

.dot-spinner__dot:nth-child(2)::before {
  animation-delay: calc(var(--uib-speed) * -.875);
}

.dot-spinner__dot:nth-child(3) {
  transform: rotate(90deg);
}

.dot-spinner__dot:nth-child(3)::before {
  animation-delay: calc(var(--uib-speed) * -.75);
}

.dot-spinner__dot:nth-child(4) {
  transform: rotate(135deg);
}

.dot-spinner__dot:nth-child(4)::before {
  animation-delay: calc(var(--uib-speed) * -.625);
}

.dot-spinner__dot:nth-child(5) {
  transform: rotate(180deg);
}

.dot-spinner__dot:nth-child(5)::before {
  animation-delay: calc(var(--uib-speed) * -.5);
}

.dot-spinner__dot:nth-child(6) {
  transform: rotate(225deg);
}

.dot-spinner__dot:nth-child(6)::before {
  animation-delay: calc(var(--uib-speed) * -.375);
}

.dot-spinner__dot:nth-child(7) {
  transform: rotate(270deg);
}

.dot-spinner__dot:nth-child(7)::before {
  animation-delay: calc(var(--uib-speed) * -.25);
}

.dot-spinner__dot:nth-child(8) {
  transform: rotate(315deg);
}

.dot-spinner__dot:nth-child(8)::before {
  animation-delay: calc(var(--uib-speed) * -.125);
}

@keyframes pulse0112 {
  0%,
  100% {
    transform: scale(0);
    opacity: 0.5;
  }

  50% {
    transform: scale(1);
    opacity: 1;
  }
}`; document.head.appendChild(style); 