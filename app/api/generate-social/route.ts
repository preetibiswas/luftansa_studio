type SocialPosts = {
  linkedin: string;
  instagram: string;
  facebook: string;
};

type Platform = keyof SocialPosts;

type SocialImages = Record<
  Platform,
  {
    prompt: string;
    dataUrl?: string;
    error?: string;
  }
>;

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          mimeType?: string;
          data?: string;
        };
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

type GeminiModel = {
  name: string;
  supportedGenerationMethods?: string[];
};

type ImageModelCandidate = {
  model: string;
  method: "generateContent" | "predict";
};

type GeminiModelsResponse = {
  models?: GeminiModel[];
  error?: {
    message?: string;
  };
};

type ImagenPredictResponse = {
  predictions?: Array<{
    bytesBase64Encoded?: string;
    mimeType?: string;
  }>;
  error?: {
    message?: string;
  };
};

type GeminiClient = {
  apiKey: string;
  models: GeminiModel[];
};

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const TEXT_MODEL_FALLBACKS = [
  GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-1.5-flash",
];
const platforms: Platform[] = ["linkedin", "instagram", "facebook"];

function stripCodeFences(value: string) {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  return (fenced?.[1] ?? trimmed).trim();
}

function parseSocialPosts(rawText: string): SocialPosts {
  try {
    const parsed = JSON.parse(stripCodeFences(rawText)) as Partial<SocialPosts>;

    if (
      typeof parsed.linkedin !== "string" ||
      typeof parsed.instagram !== "string" ||
      typeof parsed.facebook !== "string"
    ) {
      throw new Error("Missing platform copy");
    }

    return {
      linkedin: parsed.linkedin.trim(),
      instagram: parsed.instagram.trim(),
      facebook: parsed.facebook.trim(),
    };
  } catch {
    throw new Error("The LLM returned invalid JSON for the social posts.");
  }
}

function getGeminiApiKeys() {
  return Array.from({ length: 5 }, (_, index) => {
    const key = process.env[`GEMINI_API_KEY_${index + 1}`];
    return key?.trim();
  }).filter((key): key is string => Boolean(key));
}

function modelId(modelName: string) {
  return modelName.replace(/^models\//, "");
}

function supportsGenerateContent(model: GeminiModel) {
  return model.supportedGenerationMethods?.includes("generateContent") ?? false;
}

function supportsPredict(model: GeminiModel) {
  return model.supportedGenerationMethods?.includes("predict") ?? false;
}

async function listGeminiModels(apiKey: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
  );
  const data = (await response.json()) as GeminiModelsResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Unable to list Gemini models.");
  }

  return data.models ?? [];
}

async function getAvailableGeminiClients(apiKeys: string[]) {
  const clients = await Promise.all(
    apiKeys.map(async (apiKey) => {
      try {
        const models = await listGeminiModels(apiKey);
        return { apiKey, models };
      } catch {
        return null;
      }
    }),
  );

  return clients.filter((client): client is GeminiClient => Boolean(client));
}

function getTextModelCandidates(models: GeminiModel[]) {
  const available = new Set(
    models.filter(supportsGenerateContent).map((model) => modelId(model.name)),
  );

  const preferredModels = TEXT_MODEL_FALLBACKS.filter((model) =>
    available.has(modelId(model)),
  );

  return preferredModels.length > 0
    ? preferredModels
    : Array.from(available).filter((model) => model.includes("flash"));
}

function getImageModelCandidates(models: GeminiModel[]): ImageModelCandidate[] {
  const generateContentModels = models
    .filter(
      (model) =>
        supportsGenerateContent(model) &&
        model.name.toLowerCase().includes("image"),
    )
    .map((model) => ({
      model: modelId(model.name),
      method: "generateContent" as const,
    }));

  const predictModels = models
    .filter(
      (model) =>
        supportsPredict(model) &&
        /image|imagen/i.test(model.name),
    )
    .map((model) => ({
      model: modelId(model.name),
      method: "predict" as const,
    }));

  const availableImageModels = [...generateContentModels, ...predictModels];

  const configuredModel = process.env.GEMINI_IMAGE_MODEL;

  if (
    configuredModel &&
    availableImageModels.some(
      (candidate) => candidate.model === modelId(configuredModel),
    )
  ) {
    return [
      ...availableImageModels.filter(
        (candidate) => candidate.model === modelId(configuredModel),
      ),
      ...availableImageModels.filter(
        (candidate) => candidate.model !== modelId(configuredModel),
      ),
    ];
  }

  return availableImageModels;
}

async function generateWithGemini(
  apiKey: string,
  model: string,
  body: Record<string, unknown>,
) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId(model)}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Gemini request failed.");
  }

  return data;
}

async function predictWithImagen(apiKey: string, model: string, prompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId(model)}:predict?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1 },
      }),
    },
  );

  const data = (await response.json()) as ImagenPredictResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Imagen request failed.");
  }

  const prediction = data.predictions?.[0];
  const imageData = prediction?.bytesBase64Encoded;

  if (!imageData) {
    throw new Error("Imagen did not return an image.");
  }

  return `data:${prediction.mimeType ?? "image/png"};base64,${imageData}`;
}

async function generateSocialText(clients: GeminiClient[], prompt: string) {
  let lastError = "Unable to generate social posts.";

  for (const client of clients) {
    const modelCandidates = getTextModelCandidates(client.models);

    for (const model of modelCandidates) {
      try {
        const data = await generateWithGemini(client.apiKey, model, {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 900,
            responseMimeType: "application/json",
          },
        });

        const rawText =
          data.candidates?.[0]?.content?.parts
            ?.map((part) => part.text ?? "")
            .join("\n")
            .trim() ?? "";

        return parseSocialPosts(rawText);
      } catch (error) {
        lastError =
          error instanceof Error
            ? error.message
            : "Unable to generate social posts.";
      }
    }
  }

  throw new Error(lastError);
}

function buildImagePrompt(
  platform: Platform,
  campaignIdea: string,
  postText: string,
) {
  const formatHints: Record<Platform, string> = {
    linkedin: "a polished 1200x627 professional social banner",
    instagram: "a premium square Instagram visual with strong travel emotion",
    facebook: "a warm feed-friendly lifestyle visual for a broad audience",
  };

  return `Create ${formatHints[platform]} for Lufthansa.

Campaign idea: ${campaignIdea}
Platform post text: ${postText}

Use Lufthansa-inspired premium aviation and travel aesthetics, blue and white tones, natural lighting, and aspirational destination imagery. Do not add logos, watermarks, UI chrome, or readable text in the image.`;
}

async function generateImageForPlatform(
  clients: GeminiClient[],
  platform: Platform,
  prompt: string,
) {
  let lastError = "Image generation failed.";

  for (const client of clients) {
    const modelCandidates = getImageModelCandidates(client.models);

    if (modelCandidates.length === 0) {
      lastError =
        "No available Gemini image model was found for the configured keys.";
      continue;
    }

    for (const candidate of modelCandidates) {
      try {
        if (candidate.method === "predict") {
          return predictWithImagen(client.apiKey, candidate.model, prompt);
        }

        const data = await generateWithGemini(client.apiKey, candidate.model, {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        });

        const imagePart = data.candidates?.[0]?.content?.parts?.find(
          (part) => part.inlineData?.data,
        );
        const mimeType = imagePart?.inlineData?.mimeType ?? "image/png";
        const imageData = imagePart?.inlineData?.data;

        if (!imageData) {
          throw new Error(`Gemini did not return an image for ${platform}.`);
        }

        return `data:${mimeType};base64,${imageData}`;
      } catch (error) {
        lastError =
          error instanceof Error ? error.message : "Image generation failed.";
      }
    }
  }

  throw new Error(lastError);
}

async function generateSocialImages(
  clients: GeminiClient[],
  campaignIdea: string,
  posts: SocialPosts,
): Promise<SocialImages> {
  const entries = await Promise.all(
    platforms.map(async (platform) => {
      const imagePrompt = buildImagePrompt(
        platform,
        campaignIdea,
        posts[platform],
      );

      try {
        const dataUrl = await generateImageForPlatform(
          clients,
          platform,
          imagePrompt,
        );

        return [platform, { prompt: imagePrompt, dataUrl }] as const;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Image generation failed.";

        return [platform, { prompt: imagePrompt, error: message }] as const;
      }
    }),
  );

  return Object.fromEntries(entries) as SocialImages;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const campaignIdea =
    typeof body === "object" &&
    body !== null &&
    "campaignIdea" in body &&
    typeof body.campaignIdea === "string"
      ? body.campaignIdea.trim()
      : "";

  if (!campaignIdea) {
    return Response.json(
      { error: "Campaign idea is required." },
      { status: 400 },
    );
  }

  const apiKeys = getGeminiApiKeys();

  if (apiKeys.length === 0) {
    return Response.json(
      { error: "No Gemini API keys are configured for social generation." },
      { status: 500 },
    );
  }

  const clients = await getAvailableGeminiClients(apiKeys);

  if (clients.length === 0) {
    return Response.json(
      { error: "No configured Gemini API key could list available models." },
      { status: 500 },
    );
  }

  const prompt = `You are a senior social media marketer for Lufthansa.

Create three distinct, platform-appropriate social posts from this campaign idea:
"${campaignIdea}"

Return only a valid JSON object with exactly these string keys:
{
  "linkedin": "A polished professional LinkedIn post. Use a credible, business-friendly tone and 2-4 relevant hashtags.",
  "instagram": "A visually evocative Instagram caption. Use a warmer tone, tasteful emojis, and 4-6 relevant hashtags.",
  "facebook": "A friendly Facebook post. Use accessible language and a clear invitation to engage."
}

Do not wrap the JSON in markdown. Do not include any extra commentary.`;

  try {
    const posts = await generateSocialText(clients, prompt);
    const images = await generateSocialImages(clients, campaignIdea, posts);

    return Response.json({ posts, images });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to generate social posts.";

    return Response.json({ error: message }, { status: 502 });
  }
}
