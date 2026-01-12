/**
 * ICE Server Configuration
 * Uses hardcoded professional TURN credentials from Metered.ca.
 */

export const ICE_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.services.mozilla.com' },
        {
            urls: "stun:stun.relay.metered.ca:80",
        },
        {
            urls: "turn:global.relay.metered.ca:80",
            username: "86eb124fe213389dfdc437c1",
            credential: "V4MDsFtwESUIIPHg",
        },
        {
            urls: "turn:global.relay.metered.ca:80?transport=tcp",
            username: "86eb124fe213389dfdc437c1",
            credential: "V4MDsFtwESUIIPHg",
        },
        {
            urls: "turn:global.relay.metered.ca:443",
            username: "86eb124fe213389dfdc437c1",
            credential: "V4MDsFtwESUIIPHg",
        },
        {
            urls: "turns:global.relay.metered.ca:443?transport=tcp",
            username: "86eb124fe213389dfdc437c1",
            credential: "V4MDsFtwESUIIPHg",
        },
    ],
    iceCandidatePoolSize: 10,
};
