type Platform = "linkedin" | "instagram" | "facebook";

type GenerateCopyBody = {
  platform?: unknown;
  goal?: unknown;
  action?: unknown;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const TEXT_MODEL_FALLBACKS = [
  GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-1.5-flash",
];

const platformTones: Record<Platform, string> = {
  linkedin:
    "polished, credible, descriptive, and business-friendly with a professional call to action",
  instagram:
    "visual, emotive, warm, nostalgic when relevant, and aspirational with a modern caption style",
  facebook:
    "friendly, descriptive, accessible, community-oriented, and conversational with a clear invitation to act",
};

const platformGuidance: Record<Platform, string> = {
  linkedin:
    "Write 2 polished paragraphs with a strong opening, a concrete benefit or story, and 2-4 relevant hashtags.",
  instagram:
    "Write a complete Instagram caption with 2-3 expressive short paragraphs, sensory detail, a modern celebratory finish, and 4-6 relevant hashtags.",
  facebook:
    "Write 2 friendly paragraphs with enough context for a broad audience, a conversational invitation, and an optional question.",
};

const allowedPlatforms = new Set<Platform>([
  "linkedin",
  "instagram",
  "facebook",
]);

function isPlatform(value: unknown): value is Platform {
  return typeof value === "string" && allowedPlatforms.has(value as Platform);
}

function isUsableApiKey(apiKey: string | undefined): apiKey is string {
  const value = apiKey?.trim();

  return Boolean(value && !/placeholder/i.test(value));
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getGeminiApiKeys() {
  return Array.from({ length: 5 }, (_, index) => {
    const key = process.env[`GEMINI_API_KEY_${index + 1}`];
    return isUsableApiKey(key) ? key.trim() : undefined;
  }).filter((key): key is string => Boolean(key));
}

function modelId(modelName: string) {
  return modelName.replace(/^models\//, "");
}

function extractCopy(data: GeminiResponse) {
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n")
      .trim() ?? ""
  );
}

function looksIncomplete(copy: string) {
  return /(?:\b(?:we|we've|you|you've|it|it's|that|the|a|an|to|for|with|and|or|but|because)|[,;:("-])$/i.test(
    copy.trim(),
  );
}

async function generateCopyWithGemini(
  apiKey: string,
  model: string,
  prompt: string,
) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId(model)}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.75,
          maxOutputTokens: 900,
        },
      }),
    },
  );

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Gemini copy generation failed.");
  }

  const copy = extractCopy(data);

  if (!copy) {
    throw new Error("Gemini did not return copy.");
  }

  if (looksIncomplete(copy)) {
    throw new Error("Gemini returned incomplete copy.");
  }

  return copy;
}

async function generateCopy(
  platform: Platform,
  goal: string,
  action: string,
) {
  const apiKeys = getGeminiApiKeys();

  if (apiKeys.length === 0) {
    throw new Error("No Gemini API keys are configured for copy generation.");
  }

  const prompt = `You are a professional copywriter for Lufthansa marketing campaigns. Write persuasive, brand-safe copy that feels premium, human, descriptive, and specific.

Create one ${platform} marketing copy variant.

Platform tone: ${platformTones[platform]}
Platform structure: ${platformGuidance[platform]}
User goal: ${goal}
Desired action: ${action}

Requirements:
- Tailor the copy to the selected platform and goal.
- Make the story, occasion, offer, or benefit feel concrete and persuasive.
- If the goal asks for a mood, theme, anniversary, or campaign angle, reflect it directly.
- Include a clear call to action aligned with the desired action.
- Finish every sentence. Do not stop mid-thought.
- Keep it ready to paste into the platform.
- Return only the final copy, with no labels or commentary.`;

  let lastError = "Unable to generate copy.";

  for (const apiKey of apiKeys) {
    for (const model of TEXT_MODEL_FALLBACKS) {
      try {
        return await generateCopyWithGemini(apiKey, model, prompt);
      } catch (error) {
        lastError =
          error instanceof Error ? error.message : "Unable to generate copy.";
      }
    }
  }

  throw new Error(lastError);
}

export async function POST(request: Request) {
  let body: GenerateCopyBody;

  try {
    body = (await request.json()) as GenerateCopyBody;
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  if (!isPlatform(body.platform)) {
    return Response.json(
      { error: "Platform must be LinkedIn, Instagram, or Facebook." },
      { status: 400 },
    );
  }

  const goal = readString(body.goal);
  const action = readString(body.action);

  if (!goal) {
    return Response.json({ error: "Goal is required." }, { status: 400 });
  }

  if (!action) {
    return Response.json({ error: "Action is required." }, { status: 400 });
  }

  try {
    const copy = await generateCopy(body.platform, goal, action);

    return Response.json({ copy });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to generate copy.";

    return Response.json({ error: message }, { status: 502 });
  }
}
