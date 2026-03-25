/**
 * Default word lists for spelling practice
 */
export const DEFAULT_WORD_LISTS = {
    beginner: [
        "apple", "beach", "cloud", "dance", "eagle",
        "forest", "grape", "house", "island", "jelly"
    ],
    intermediate: [
        "adventure", "beautiful", "calendar", "daughter", "elephant",
        "fountain", "grateful", "hospital", "important", "journey"
    ],
    advanced: [
        "accommodation", "bureaucracy", "conscientious", "definitely", "ecstatic",
        "fluorescent", "government", "hierarchy", "indispensable", "judgment"
    ],
    ielts: [
        "accommodation", "address", "admission", "advertisement", "agreement", "airline", "airport", "appointment", "application", "arrival", "assistant", "attendance", "balance", "baggage", "building", "business", "calendar", "cancellation", "category", "certificate", "change", "cheque", "client", "college", "communication", "company", "complaint", "confirmation", "connection", "construction", "contact", "contract", "contribution", "course", "customer", "deadline", "delivery", "department", "description", "destination", "development", "discount", "document", "duration", "education", "electricity", "employee", "employer", "equipment", "experience", "facility", "feedback", "finance", "furniture", "government", "graduate", "guarantee", "health", "hospital", "identity", "industry", "information", "insurance", "interest", "interview", "invoice", "journey", "language", "lecture", "library", "location", "management", "manager", "maintenance", "material", "membership", "message", "method", "mistake", "mobile", "network", "occupation", "office", "operation", "opportunity", "organization", "payment", "performance", "permission", "personal", "platform", "policy", "position", "possible", "practice", "preference", "preparation", "price", "priority", "procedure", "process", "product", "programme", "project", "property", "purpose", "qualification", "quantity", "reception", "recommendation", "reference", "refund", "registration", "relationship", "replacement", "requirement", "research", "reservation", "resource", "response", "restaurant", "result", "schedule", "scholarship", "service", "solution", "standard", "statement", "strategy", "student", "subject", "subscription", "success", "suggestion", "support", "system", "technology", "telephone", "temperature", "transport", "university", "update", "vacation", "vehicle", "visitor", "weather", "website"
    ]
};

/**
 * Text-to-Speech utility
 */
export const speakWord = (word: string, rate: number = 0.8) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(word);
        utterance.rate = rate; 
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Try to find a premium English voice
        const voices = window.speechSynthesis.getVoices();
        
        // Priority: Google US English > Microsoft David > Samantha > Any EN-US
        const preferredVoices = [
            'Google US English',
            'Microsoft David',
            'Samantha',
            'en-US'
        ];

        let selectedVoice = null;
        for (const pref of preferredVoices) {
            selectedVoice = voices.find(v => v.name.includes(pref) || v.lang.startsWith(pref));
            if (selectedVoice) break;
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        } else if (voices.length > 0) {
            utterance.voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        }

        window.speechSynthesis.speak(utterance);
    }
};

/**
 * Parses a string of words (comma or newline separated) into an array
 */
export const parseWordList = (input: string): string[] => {
    return input
        .split(/[,\n]/)
        .map(w => w.trim())
        .filter(w => w.length > 0);
};

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
export const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};
