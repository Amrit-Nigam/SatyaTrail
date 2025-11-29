/**
 * Enhanced Seed Data Script for SatyaTrail Backend
 *
 * Populates MongoDB with REAL and FAKE news verification data from November 2025.
 * Run with: node scripts/seed-data-nov2025.js
 *
 * Options:
 *   --clear    Clear existing data before seeding
 *   --count=N  Number of verifications to create (default: 25)
 */

require("dotenv").config();
const mongoose = require("mongoose");
const crypto = require("crypto");

const SourceGraph = require("../models/SourceGraph");
const AgentReport = require("../models/AgentReport");
const Reputation = require("../models/Reputation");

// Parse command line arguments
const args = process.argv.slice(2);
const shouldClear = args.includes("--clear");
const countArg = args.find((arg) => arg.startsWith("--count="));
const count = countArg ? parseInt(countArg.split("=")[1]) : 25;

/**
 * REAL AND FAKE NEWS CLAIMS FOR NOVEMBER 2025
 * Mix of verified facts and plausible misinformation
 */
const SAMPLE_CLAIMS = [
    // REAL NEWS - VERIFIED
    {
        claim: "Prime Minister Narendra Modi announced a ₹1 Lakh Crore Research Development and Innovation Scheme to strengthen private sector-led R&D ecosystem at ESTIC 2025 on November 3.",
        verdict: "true",
        accuracyScore: 95,
        sources: [
            {
                domain: "pmindia.gov.in",
                title: "PM Launches ₹1 Lakh Crore RDI Scheme",
                role: "origin",
            },
            {
                domain: "thehindu.com",
                title: "Modi Announces R&D Innovation Fund",
                role: "amplifier",
            },
            {
                domain: "economictimes.indiatimes.com",
                title: "Government Launches Major R&D Initiative",
                role: "modifier",
            },
        ],
    },

    // REAL NEWS - VERIFIED
    {
        claim: "Qualcomm Technologies officially announced the Snapdragon 8 Gen 5 mobile platform on November 25, 2025 in San Diego, positioning it as the world's most advanced mobile processor.",
        verdict: "true",
        accuracyScore: 93,
        sources: [
            {
                domain: "qualcomm.com",
                title: "Snapdragon 8 Gen 5 Official Launch",
                role: "origin",
            },
            {
                domain: "businesstoday.in",
                title: "Qualcomm Announces Latest Flagship Chip",
                role: "amplifier",
            },
            {
                domain: "gsmarena.com",
                title: "Snapdragon 8 Gen 5 Specifications Released",
                role: "modifier",
            },
        ],
    },

    // REAL NEWS - VERIFIED
    {
        claim: "Realme launched the C85 5G in India on November 28, 2025 with a 7,000mAh battery, IP69 durability rating, and 144Hz display starting at ₹14,999.",
        verdict: "true",
        accuracyScore: 94,
        sources: [
            {
                domain: "realme.com",
                title: "Realme C85 5G Official Launch",
                role: "origin",
            },
            {
                domain: "businesstoday.in",
                title: "Realme C85 5G Launched in India",
                role: "amplifier",
            },
            {
                domain: "gsmarena.com",
                title: "Realme C85 5G Specs and Price",
                role: "modifier",
            },
        ],
    },

    // REAL NEWS - VERIFIED
    {
        claim: "Kashmir experienced its coldest November since 2007, with temperatures dropping to -4.5 degrees Celsius in Srinagar in late November 2025.",
        verdict: "true",
        accuracyScore: 92,
        sources: [
            {
                domain: "pib.gov.in",
                title: "Kashmir Weather Advisory Released",
                role: "origin",
            },
            {
                domain: "thehindu.com",
                title: "Kashmir Records Coldest November in 18 Years",
                role: "amplifier",
            },
            {
                domain: "ndtv.com",
                title: "Srinagar Temperature Hits Historic Low",
                role: "modifier",
            },
        ],
    },

    // REAL NEWS - VERIFIED (Political)
    {
        claim: "Nitish Kumar was sworn in as Bihar Chief Minister for the 10th term in November 2025, with PM Modi attending the ceremony to lead massive NDA turnout in Patna.",
        verdict: "true",
        accuracyScore: 91,
        sources: [
            {
                domain: "pib.gov.in",
                title: "Nitish Kumar Sworn in as Bihar CM (10th Term)",
                role: "origin",
            },
            {
                domain: "thehindu.com",
                title: "PM Modi Attends Nitish Kumar Oath Ceremony",
                role: "amplifier",
            },
            {
                domain: "indianexpress.com",
                title: "Nitish Kumar Begins Dashavtar as Bihar CM",
                role: "modifier",
            },
        ],
    },

    // REAL NEWS - VERIFIED (Sports)
    {
        claim: "Gautam Gambhir was retained as India's cricket coach for all formats despite South Africa whitewash in the recent series, announced by the BCCI on November 28, 2025.",
        verdict: "true",
        accuracyScore: 90,
        sources: [
            {
                domain: "bcci.tv",
                title: "Gautam Gambhir Retained as India Coach",
                role: "origin",
            },
            {
                domain: "thehindu.com",
                title: "Gambhir Continues as India Cricket Coach",
                role: "amplifier",
            },
            {
                domain: "espncricinfo.com",
                title: "BCCI Keeps Faith in Gambhir Despite Series Loss",
                role: "modifier",
            },
        ],
    },

    // FAKE NEWS - PLAUSIBLE MISINFORMATION
    {
        claim: "A leaked internal document claims that Apple will close all its retail stores in India by March 2026 due to new GST policies. Apple India did not respond to requests for comment.",
        verdict: "false",
        accuracyScore: 96,
        sources: [
            {
                domain: "twitter.com",
                title: "Viral Tweet About Apple Retail Closure",
                role: "origin",
            },
            {
                domain: "altnews.in",
                title: "Fact Check: False Apple India Store Closure Claim",
                role: "debunker",
            },
            {
                domain: "boomlive.in",
                title: "Misinformation Alert: Apple Retail Conspiracy",
                role: "debunker",
            },
        ],
    },

    // FAKE NEWS - PLAUSIBLE MISINFORMATION
    {
        claim: "A WhatsApp viral message claims the Reserve Bank of India announced a complete ban on cryptocurrency trading for Indian citizens starting December 1, 2025.",
        verdict: "false",
        accuracyScore: 97,
        sources: [
            {
                domain: "whatsapp.com",
                title: "Viral Message About Crypto Ban",
                role: "origin",
            },
            {
                domain: "rbi.org.in",
                title: "RBI Official Statement on Cryptocurrency Policy",
                role: "debunker",
            },
            {
                domain: "factly.in",
                title: "RBI Crypto Ban Claim is False",
                role: "debunker",
            },
        ],
    },

    // FAKE NEWS - PLAUSIBLE MISINFORMATION
    {
        claim: "A Facebook post claims that Indian government has mandated all smartphones sold in India must use government-approved keyboard software to prevent 'data leakage', effective immediately.",
        verdict: "false",
        accuracyScore: 95,
        sources: [
            {
                domain: "facebook.com",
                title: "Viral Post About Smartphone Keyboard Mandate",
                role: "origin",
            },
            {
                domain: "meity.gov.in",
                title: "No Such Keyboard Software Mandate Exists",
                role: "debunker",
            },
            {
                domain: "theprint.in",
                title: "Fact Check: Smartphone Keyboard Restriction is False",
                role: "debunker",
            },
        ],
    },

    // REAL NEWS - VERIFIED (International)
    {
        claim: "Russian President Vladimir Putin is scheduled to visit India on December 4-5, 2025 for bilateral talks with PM Modi, according to official announcements.",
        verdict: "true",
        accuracyScore: 93,
        sources: [
            {
                domain: "mea.gov.in",
                title: "Putin India Visit December 4-5 Confirmed",
                role: "origin",
            },
            {
                domain: "reuters.com",
                title: "Putin to Visit India Next Month",
                role: "amplifier",
            },
            {
                domain: "thehindu.com",
                title: "Russia-India Bilateral Talks Set for December",
                role: "modifier",
            },
        ],
    },

    // REAL NEWS - VERIFIED (International Tragedy)
    {
        claim: "A major fire in a Hong Kong tower resulted in at least 128 deaths as of late November 2025, making it one of the deadliest building fires in recent history.",
        verdict: "true",
        accuracyScore: 92,
        sources: [
            {
                domain: "rthk.hk",
                title: "Hong Kong Tower Fire Death Toll Rises",
                role: "origin",
            },
            {
                domain: "bbc.com",
                title: "Deadly Hong Kong High-Rise Fire",
                role: "amplifier",
            },
            {
                domain: "reuters.com",
                title: "Hong Kong Building Fire Leaves Hundreds Dead",
                role: "modifier",
            },
        ],
    },

    // FAKE NEWS - PLAUSIBLE MISINFORMATION
    {
        claim: "According to an unverified TikTok video, a new Indian startup has developed an AI algorithm that can predict stock market movements with 99.9% accuracy, backed by secretive government funding.",
        verdict: "false",
        accuracyScore: 94,
        sources: [
            {
                domain: "tiktok.com",
                title: "Viral TikTok About AI Stock Prediction",
                role: "origin",
            },
            {
                domain: "sebi.gov.in",
                title: "SEBI Warning: Stock Prediction AI Claims are Misleading",
                role: "debunker",
            },
            {
                domain: "factly.in",
                title: "AI Stock Prediction Scam Alert",
                role: "debunker",
            },
        ],
    },

    // REAL NEWS - VERIFIED (Technology)
    {
        claim: "OnePlus announced that their upcoming OnePlus 15R will be the world's first phone powered by Qualcomm's Snapdragon 8 Gen 5 chipset, expected to launch in December 2025.",
        verdict: "true",
        accuracyScore: 89,
        sources: [
            {
                domain: "oneplus.com",
                title: "OnePlus 15R First Snapdragon 8 Gen 5 Phone",
                role: "origin",
            },
            {
                domain: "gsmarena.com",
                title: "OnePlus 15R Official Announcement",
                role: "amplifier",
            },
            {
                domain: "androidcentral.com",
                title: "OnePlus 15R Confirmed with Latest Snapdragon",
                role: "modifier",
            },
        ],
    },

    // FAKE NEWS - HEALTH MISINFORMATION
    {
        claim: "A viral Instagram post claims that the new dengue vaccine approved by Brazil will cause magnetic field sensitivity in vaccinated individuals within 6 months.",
        verdict: "false",
        accuracyScore: 98,
        sources: [
            {
                domain: "instagram.com",
                title: "Viral Post About Dengue Vaccine Side Effects",
                role: "origin",
            },
            {
                domain: "who.int",
                title: "WHO Debunks Dengue Vaccine Magnetic Field Claims",
                role: "debunker",
            },
            {
                domain: "snopes.com",
                title: "Brazil Dengue Vaccine Does Not Cause Magnetism",
                role: "debunker",
            },
        ],
    },

    // REAL NEWS - VERIFIED (Legal)
    {
        claim: "Bangladesh court sentenced deposed Prime Minister Sheikh Hasina to 21 years in jail in three corruption cases related to irregularities in allocations of land in a government housing project.",
        verdict: "true",
        accuracyScore: 91,
        sources: [
            {
                domain: "bdnews24.com",
                title: "Sheikh Hasina Sentenced to 21 Years",
                role: "origin",
            },
            {
                domain: "reuters.com",
                title: "Bangladesh Court Sentences Former PM Hasina",
                role: "amplifier",
            },
            {
                domain: "bbc.com",
                title: "Hasina Corruption Trial Verdict",
                role: "modifier",
            },
        ],
    },

    // REAL NEWS - VERIFIED (International)
    {
        claim: "The United Kingdom reported that net migration dropped by two-thirds as the government rolled out tougher immigration policies in November 2025.",
        verdict: "true",
        accuracyScore: 88,
        sources: [
            {
                domain: "gov.uk",
                title: "UK Reports Significant Drop in Net Migration",
                role: "origin",
            },
            {
                domain: "bbc.com",
                title: "UK Net Migration Falls Two-Thirds",
                role: "amplifier",
            },
            {
                domain: "theguardian.com",
                title: "New UK Immigration Policy Shows Results",
                role: "modifier",
            },
        ],
    },

    // MIXED NEWS - UNVERIFIED CLAIMS
    {
        claim: "Reports suggest that Imran Khan's health status in Adiala Jail remains unclear, with conflicting statements from Pakistani authorities and his family regarding his wellbeing in late November 2025.",
        verdict: "mixed",
        accuracyScore: 72,
        sources: [
            {
                domain: "twitter.com",
                title: "Imran Khan Health Rumors Circulating",
                role: "origin",
            },
            {
                domain: "altnews.in",
                title: "Imran Khan Status: Claims Need Verification",
                role: "debunker",
            },
            {
                domain: "theprint.in",
                title: "Imran Khan Detention Conditions Under Scrutiny",
                role: "modifier",
            },
        ],
    },

    // FAKE NEWS - PLAUSIBLE MISINFORMATION
    {
        claim: "An unverified LinkedIn post claims that Microsoft, Nvidia, and Anthropic have formed a secret partnership worth $500 billion to build AI models exclusively for military applications, hidden from public disclosure.",
        verdict: "false",
        accuracyScore: 96,
        sources: [
            {
                domain: "linkedin.com",
                title: "Viral LinkedIn Post About Tech Giants Partnership",
                role: "origin",
            },
            {
                domain: "techcrunch.com",
                title: "Fact Check: Microsoft-Nvidia-Anthropic Secret Deal is False",
                role: "debunker",
            },
            {
                domain: "reuters.com",
                title: "No Hidden Tech Giant Military AI Partnership",
                role: "debunker",
            },
        ],
    },

    // REAL NEWS - VERIFIED (Tragedy)
    {
        claim: "A woman constable was injured when an Improvised Explosive Device (IED) planted by Naxalites went off in Chhattisgarh's Sukma district on November 27, 2025.",
        verdict: "true",
        accuracyScore: 90,
        sources: [
            {
                domain: "pib.gov.in",
                title: "IED Blast in Sukma District",
                role: "origin",
            },
            {
                domain: "thehindu.com",
                title: "Naxal IED Injures Woman Constable",
                role: "amplifier",
            },
            {
                domain: "ndtv.com",
                title: "Chhattisgarh Police Officer Wounded in Blast",
                role: "modifier",
            },
        ],
    },

    // FAKE NEWS - CONSPIRACY THEORY
    {
        claim: "A TikTok conspiracy theory claims that the Election Commission has developed an 'AI app' to manipulate voter data during elections, particularly targeting opposition votes.",
        verdict: "false",
        accuracyScore: 97,
        sources: [
            {
                domain: "tiktok.com",
                title: "Viral TikTok About EC AI Election Manipulation",
                role: "origin",
            },
            {
                domain: "eci.gov.in",
                title: "EC Denies AI Election Manipulation Claims",
                role: "debunker",
            },
            {
                domain: "boomlive.in",
                title: "Election Commission AI Conspiracy Debunked",
                role: "debunker",
            },
        ],
    },

    // REAL NEWS - VERIFIED (Legal)
    {
        claim: "Jasir Bilal Wani, a key accused in the Red Fort blast case, was sent to 7-day National Investigating Agency custody by a Delhi court on November 27, 2025.",
        verdict: "true",
        accuracyScore: 91,
        sources: [
            {
                domain: "pib.gov.in",
                title: "Red Fort Blast Accused in NIA Custody",
                role: "origin",
            },
            {
                domain: "thehindu.com",
                title: "Wani Remanded to NIA for Interrogation",
                role: "amplifier",
            },
            {
                domain: "indianexpress.com",
                title: "Red Fort Case: Accused Sent to Custody",
                role: "modifier",
            },
        ],
    },

    // REAL NEWS - VERIFIED (Technology - Tesla)
    {
        claim: "Tesla opened its largest market hub in India in November 2025, combining retail, charging, and service operations into a single seamless experience.",
        verdict: "true",
        accuracyScore: 87,
        sources: [
            {
                domain: "tesla.com",
                title: "Tesla India Hub Grand Opening",
                role: "origin",
            },
            {
                domain: "thehindu.com",
                title: "Tesla Expands India Operations with New Hub",
                role: "amplifier",
            },
            {
                domain: "economictimes.indiatimes.com",
                title: "Tesla Sets Up India Market Hub",
                role: "modifier",
            },
        ],
    },

    // FAKE NEWS - ENVIRONMENTAL HOAX
    {
        claim: "A viral email chain claims that the Indian government has decided to plant trees with genetically modified seeds that grow 10 times faster but are secretly designed to absorb 5G radiation.",
        verdict: "false",
        accuracyScore: 99,
        sources: [
            {
                domain: "email",
                title: "Viral Email About GM Trees and 5G",
                role: "origin",
            },
            {
                domain: "moef.gov.in",
                title: "Ministry Denies GM Tree Conspiracy",
                role: "debunker",
            },
            {
                domain: "snopes.com",
                title: "No Such Government Tree Initiative Exists",
                role: "debunker",
            },
        ],
    },

    // REAL NEWS - VERIFIED (Economy)
    {
        claim: "The Finance Ministry reported that GST rate rationalization has given a measurable boost to consumption, with the Indian economy on stable footing to maintain growth momentum through FY2025.",
        verdict: "true",
        accuracyScore: 89,
        sources: [
            {
                domain: "pib.gov.in",
                title: "Finance Ministry Reports GST Impact",
                role: "origin",
            },
            {
                domain: "economictimes.indiatimes.com",
                title: "GST Reforms Boost Consumption",
                role: "amplifier",
            },
            {
                domain: "theprint.in",
                title: "Economic Growth Maintained After GST Changes",
                role: "modifier",
            },
        ],
    },

    // MIXED NEWS - UNVERIFIED INCIDENT
    {
        claim: "A Delhi Police operation arrested a gangster allegedly linked to firing at Kapil Sharma's Canada restaurant in November 2025, though details of the incident remain under investigation.",
        verdict: "mixed",
        accuracyScore: 68,
        sources: [
            {
                domain: "twitter.com",
                title: "Delhi Police Arrest in Kapil Sharma Restaurant Incident",
                role: "origin",
            },
            {
                domain: "thehindu.com",
                title: "Gangster Arrested in Connection with Restaurant Shooting",
                role: "amplifier",
            },
            {
                domain: "altnews.in",
                title: "Kapil Sharma Restaurant Incident: Verification Ongoing",
                role: "debunker",
            },
        ],
    },

    // FAKE NEWS - SPORTS HOAX
    {
        claim: "A viral tweet claims that FIFA announced India will host the 2030 World Cup with 200,000-capacity stadiums under construction across 12 cities, secretly confirmed by PM Modi.",
        verdict: "false",
        accuracyScore: 98,
        sources: [
            {
                domain: "twitter.com",
                title: "Viral Tweet About India FIFA 2030 World Cup",
                role: "origin",
            },
            {
                domain: "fifa.com",
                title: "FIFA Official Statement on 2030 Venues",
                role: "debunker",
            },
            {
                domain: "factly.in",
                title: "India 2030 World Cup Claim is Misinformation",
                role: "debunker",
            },
        ],
    },

    // REAL NEWS - VERIFIED (Sports)
    {
        claim: "International footballer Lionel Messi confirmed Hyderabad as a stop on his GOAT Tour in late November 2025, expected to draw massive crowds to the city.",
        verdict: "true",
        accuracyScore: 86,
        sources: [
            {
                domain: "instagram.com",
                title: "Messi Confirms GOAT Tour Hyderabad Stop",
                role: "origin",
            },
            {
                domain: "thehindu.com",
                title: "Messi GOAT Tour to Visit Hyderabad",
                role: "amplifier",
            },
            {
                domain: "sportstar.thehindu.com",
                title: "Hyderabad Gets Messi GOAT Tour Date",
                role: "modifier",
            },
        ],
    },

    // REAL NEWS - VERIFIED (Weather Alert)
    {
        claim: "Cyclone Ditwah intensified in late November 2025, with the Indian Meteorological Department putting several Kerala districts on yellow alert with expectations of intense rainfall till weekend.",
        verdict: "true",
        accuracyScore: 91,
        sources: [
            {
                domain: "imd.gov.in",
                title: "Cyclone Ditwah Alert for Kerala",
                role: "origin",
            },
            {
                domain: "ndtv.com",
                title: "Intense Rainfall Expected in Kerala",
                role: "amplifier",
            },
            {
                domain: "thehindu.com",
                title: "Cyclone Ditwah Prompts Weather Advisory",
                role: "modifier",
            },
        ],
    },
];

// Agent configurations
const AGENTS = [
    { name: "Times of India Verification Agent", type: "toi" },
    { name: "NDTV Fact Check Agent", type: "ndtv" },
    { name: "India Today Verification AI", type: "indiaTimes" },
    { name: "Generic Verification Agent", type: "generic" },
];

// Request sources (must match SourceGraph model enum)
const SOURCES = ["frontend", "telegram", "twitter", "extension"];

/**
 * Generate a deterministic hash from content
 */
function generateHash(content) {
    return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Generate a mock blockchain transaction hash
 */
function generateBlockchainHash() {
    return "0x" + crypto.randomBytes(20).toString("hex");
}

/**
 * Create nodes from sources
 */
function createNodes(sources, baseTime) {
    return sources.map((source, index) => {
        const timestamp = new Date(baseTime.getTime() + index * 60000); // 1 min apart
        return {
            id: `node_${index}`,
            url: `https://${source.domain}/article-${index}`,
            title: source.title,
            snippet: `This article discusses ${source.title.toLowerCase()}. It provides detailed information and analysis about the topic.`,
            timestamp: timestamp,
            domainReputation: source.domain.includes("gov")
                ? 95
                : source.domain.includes("edu")
                ? 85
                : [
                      "reuters.com",
                      "bbc.com",
                      "thehindu.com",
                      "theprint.in",
                  ].some((d) => source.domain.includes(d))
                ? 90
                : [
                      "twitter.com",
                      "facebook.com",
                      "whatsapp.com",
                      "tiktok.com",
                      "instagram.com",
                      "linkedin.com",
                      "email",
                  ].some((d) => source.domain.includes(d))
                ? 25
                : [
                      "altnews.in",
                      "boomlive.in",
                      "factly.in",
                      "factcheck.org",
                      "snopes.com",
                  ].some((d) => source.domain.includes(d))
                ? 95
                : 70,
            role: source.role,
            author: `News Reporter ${index + 1}`,
            domain: source.domain,
        };
    });
}

/**
 * Create edges between nodes
 */
function createEdges(nodes) {
    const edges = [];
    const originNode = nodes.find((n) => n.role === "origin") || nodes[0];

    for (let i = 1; i < nodes.length; i++) {
        const fromNode = nodes[i - 1];
        const toNode = nodes[i];

        let relationship = "amplifies";
        if (toNode.role === "debunker") {
            relationship = "contradicts";
        } else if (toNode.role === "modifier") {
            relationship = "quotes";
        }

        edges.push({
            id: `edge_${i - 1}`,
            from: fromNode.id,
            to: toNode.id,
            relationship: relationship,
            timestamp: toNode.timestamp,
            evidence: `Temporal sequence: ${fromNode.title} -> ${toNode.title}`,
            aiDetected: false,
        });

        // If debunker, also connect to origin
        if (toNode.role === "debunker" && fromNode.id !== originNode.id) {
            edges.push({
                id: `edge_origin_${i}`,
                from: originNode.id,
                to: toNode.id,
                relationship: "contradicts",
                timestamp: toNode.timestamp,
                evidence: "Debunker addresses original claim",
                aiDetected: true,
            });
        }
    }

    return edges;
}

/**
 * Generate agent reports
 */
function generateAgentReports(claim, verdict, agents) {
    return agents.map((agent) => {
        // Agents may agree or disagree with final verdict
        const agrees = Math.random() > 0.15; // 85% agreement rate
        const agentVerdict = agrees
            ? verdict
            : ["true", "false", "mixed", "unknown"].find(
                  (v) => v !== verdict
              ) || "unknown";

        const credibilityScore = 65 + Math.floor(Math.random() * 30);
        const confidence = 0.6 + Math.random() * 0.35;

        return {
            agentName: agent.name,
            agentType: agent.type,
            credibilityScore,
            confidence,
            verdict: agentVerdict,
            summary: `${agent.name} analysis: The claim "${claim.substring(
                0,
                60
            )}..." appears to be ${
                agentVerdict === "true"
                    ? "accurate and verified"
                    : agentVerdict === "false"
                    ? "inaccurate or misleading"
                    : "partially accurate or unverified"
            }.`,
            detailedReasoning: `After thorough analysis of available evidence and source credibility, ${agent.name} determined that this claim is ${agentVerdict}. Cross-referenced multiple independent sources and verified factual claims where possible.`,
            evidenceLinks: [
                `https://example.com/evidence1`,
                `https://example.com/evidence2`,
                `https://example.com/evidence3`,
            ],
            keyFindings: [
                "Source credibility evaluated",
                "Temporal sequence verified",
                "Independent confirmations checked",
                "Domain reputation assessed",
            ],
            concerns:
                agentVerdict === "unknown" || agentVerdict === "mixed"
                    ? [
                          "Limited independent verification",
                          "Conflicting sources",
                      ]
                    : [],
            agreedWithFinal: agrees,
        };
    });
}

/**
 * Clear existing data
 */
async function clearData() {
    console.log("🗑️  Clearing existing data...");
    await SourceGraph.deleteMany({});
    await AgentReport.deleteMany({});
    await Reputation.deleteMany({});
    console.log("✅ Data cleared");
}

/**
 * Seed reputation data
 */
async function seedReputations() {
    console.log("👥 Seeding agent reputations...");

    for (const agent of AGENTS) {
        const reputation = await Reputation.getOrCreate(agent.name, agent.type);

        // Set initial reputation scores based on agent type
        const scores = {
            toi: 78,
            ndtv: 82,
            indiaTimes: 75,
            generic: 72,
        };

        reputation.currentScore = scores[agent.type] || 75;
        reputation.stats.totalVerifications =
            Math.floor(Math.random() * 60) + 40;
        reputation.stats.correctPredictions = Math.floor(
            reputation.stats.totalVerifications * 0.8
        );
        reputation.stats.incorrectPredictions =
            reputation.stats.totalVerifications -
            reputation.stats.correctPredictions;
        reputation.stats.agreementWithConsensus = Math.floor(
            reputation.stats.totalVerifications * 0.85
        );
        reputation.stats.disagreementWithConsensus =
            reputation.stats.totalVerifications -
            reputation.stats.agreementWithConsensus;
        reputation.stats.avgCredibilityScore =
            72 + Math.floor(Math.random() * 22);
        reputation.stats.avgConfidence = 0.65 + Math.random() * 0.32;
        reputation.metadata.firstVerification = new Date(
            Date.now() - 60 * 24 * 60 * 60 * 1000
        ); // 60 days ago
        reputation.metadata.lastVerification = new Date();
        reputation.metadata.peakScore = reputation.currentScore + 8;
        reputation.metadata.lowestScore = Math.max(
            reputation.currentScore - 10,
            50
        );

        await reputation.save();
    }

    console.log(`✅ Seeded ${AGENTS.length} agent reputations`);
}

/**
 * Seed verification data
 */
async function seedVerifications() {
    console.log(
        `📰 Seeding ${count} verifications with real and fake news from November 2025...`
    );

    const verifications = [];
    const baseTime = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

    for (let i = 0; i < count; i++) {
        const template = SAMPLE_CLAIMS[i % SAMPLE_CLAIMS.length];
        const claim = template.claim;
        const verdict = template.verdict;
        const accuracyScore = template.accuracyScore;

        // Create nodes and edges
        const nodes = createNodes(
            template.sources,
            new Date(baseTime.getTime() + i * 60 * 60 * 1000)
        );
        const edges = createEdges(nodes);

        // Generate unique hash
        const hash = generateHash(
            claim +
                JSON.stringify(nodes.map((n) => n.id).sort()) +
                i +
                Date.now() +
                Math.random()
        );

        // Create source graph
        const sourceGraph = new SourceGraph({
            hash,
            claim,
            nodes,
            edges,
            clusters: [],
            metadata: {
                createdAt: new Date(baseTime.getTime() + i * 60 * 60 * 1000),
                sourceCount: template.sources.length,
                nodeCount: nodes.length,
                edgeCount: edges.length,
                clusterCount: 0,
                aiEnhanced: true,
                claimCategory:
                    verdict === "true"
                        ? "verified_news"
                        : verdict === "false"
                        ? "misinformation"
                        : "unverified",
            },
            blockchain: {
                provider: "polygon",
                transactionHash: generateBlockchainHash(),
                blockNumber: 43000000 + i,
                storedAt: new Date(baseTime.getTime() + i * 60 * 60 * 1000),
            },
            verification: {
                verdict,
                accuracyScore,
                confidence: 0.7 + Math.random() * 0.25,
            },
            request: {
                source: SOURCES[i % SOURCES.length],
                originalUrl: nodes[0].url,
                processingTimeMs: 1200 + Math.floor(Math.random() * 1800),
            },
        });

        await sourceGraph.save();

        // Create agent reports
        const agentReportsData = generateAgentReports(claim, verdict, AGENTS);
        const agentReports = [];

        for (const reportData of agentReportsData) {
            const agentReport = new AgentReport({
                sourceGraphId: sourceGraph._id,
                ...reportData,
            });
            await agentReport.save();
            agentReports.push(agentReport._id);
        }

        // Update source graph with agent report references
        sourceGraph.verification.agentReports = agentReports;
        await sourceGraph.save();

        verifications.push(sourceGraph);

        if ((i + 1) % 5 === 0) {
            console.log(`  ✓ Created ${i + 1}/${count} verifications`);
        }
    }

    console.log(
        `✅ Seeded ${verifications.length} verifications with ${
            verifications.length * AGENTS.length
        } agent reports`
    );
    return verifications;
}

/**
 * Main seed function
 */
async function seed() {
    try {
        console.log(
            "🌱 Starting SatyaTrail database seeding (November 2025 Real & Fake News)...\n"
        );

        // Connect to database
        if (!process.env.DATABASE_URL) {
            throw new Error("DATABASE_URL environment variable is required");
        }

        await mongoose.connect(process.env.DATABASE_URL, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        });
        console.log("✅ Connected to MongoDB\n");

        // Clear data if requested
        if (shouldClear) {
            await clearData();
            console.log("");
        }

        // Seed data
        await seedReputations();
        console.log("");
        await seedVerifications();

        console.log("\n✨ Seeding completed successfully!");

        // Print summary
        const graphCount = await SourceGraph.countDocuments();
        const reportCount = await AgentReport.countDocuments();
        const reputationCount = await Reputation.countDocuments();
        const trueCount = await SourceGraph.countDocuments({
            "verification.verdict": "true",
        });
        const falseCount = await SourceGraph.countDocuments({
            "verification.verdict": "false",
        });
        const mixedCount = await SourceGraph.countDocuments({
            "verification.verdict": "mixed",
        });

        console.log("\n📊 Database Summary:");
        console.log(`   Total Source Graphs: ${graphCount}`);
        console.log(`   Verified News (True): ${trueCount}`);
        console.log(`   Misinformation (False): ${falseCount}`);
        console.log(`   Mixed/Unverified: ${mixedCount}`);
        console.log(`   Total Agent Reports: ${reportCount}`);
        console.log(`   Agent Reputations: ${reputationCount}`);

        console.log("\n📰 Data includes:");
        console.log(
            "   ✓ Real news from November 2025 (technology, politics, sports, weather)"
        );
        console.log("   ✓ Plausible fake news and conspiracy theories");
        console.log("   ✓ Mixed/unverified claims requiring fact-checking");
        console.log("   ✓ Multi-source verification chains");
        console.log("   ✓ Agent credibility scoring and consensus tracking");

        await mongoose.connection.close();
        console.log("\n✅ Database connection closed");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run seed
seed();
