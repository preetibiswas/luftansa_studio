type GenerateBannerBody = {
  campaignText?: unknown;
};

type OpenAIImageResponse = {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  error?: {
    message?: string;
  };
};

type StabilityErrorResponse = {
  message?: string;
  errors?: string[];
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
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

type ImageModelCandidate = {
  model: string;
  method: "generateContent" | "predict";
};

const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "dall-e-3";
const STABILITY_IMAGE_MODEL =
  process.env.STABILITY_IMAGE_MODEL ?? "stable-image/generate/core";

function isUsableApiKey(apiKey: string | undefined) {
  const value = apiKey?.trim();

  return Boolean(value && !/placeholder/i.test(value));
}

function buildBannerPrompt(campaignText: string) {
  return `Marketing banner for ${campaignText}, clean design.

Create a premium Lufthansa-inspired display banner with a modern travel aesthetic, blue and white palette, spacious composition, aspirational aviation or destination imagery, and clear room for marketing copy. Do not include logos, watermarks, UI chrome, or readable text in the image.`;
}

async function generateBannerWithOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!isUsableApiKey(apiKey)) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_IMAGE_MODEL,
      prompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
      response_format: "url",
    }),
  });

  const data = (await response.json()) as OpenAIImageResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? "OpenAI image generation failed.");
  }

  const image = data.data?.[0];

  if (image?.url) {
    return image.url;
  }

  if (image?.b64_json) {
    return `data:image/png;base64,${image.b64_json}`;
  }

  throw new Error("OpenAI did not return a banner image.");
}

async function generateBannerWithStability(prompt: string) {
  const apiKey = process.env.STABILITY_API_KEY?.trim();

  if (!isUsableApiKey(apiKey)) {
    throw new Error("STABILITY_API_KEY is not configured.");
  }

  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("output_format", "png");

  const response = await fetch(`https://api.stability.ai/v2beta/${STABILITY_IMAGE_MODEL}`, {
    method: "POST",
    headers: {
      Accept: "image/*",
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    let message = "Stability image generation failed.";

    try {
      const data = (await response.json()) as StabilityErrorResponse;
      message = data.errors?.join(" ") || data.message || message;
    } catch {
      // Stability may return plain text or image bytes depending on the response.
    }

    throw new Error(message);
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());
  return `data:image/png;base64,${imageBuffer.toString("base64")}`;
}

function getGeminiApiKeys() {
  return Array.from({ length: 5 }, (_, index) => {
    const key = process.env[`GEMINI_API_KEY_${index + 1}`];
    return isUsableApiKey(key) ? key?.trim() : undefined;
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

function getGeminiImageModelCandidates(
  models: GeminiModel[],
): ImageModelCandidate[] {
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

async function generateBannerWithGemini(prompt: string) {
  const clients = await getAvailableGeminiClients(getGeminiApiKeys());
  let lastError = "Gemini image generation failed.";

  for (const client of clients) {
    const modelCandidates = getGeminiImageModelCandidates(client.models);

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
          throw new Error("Gemini did not return a banner image.");
        }

        return `data:${mimeType};base64,${imageData}`;
      } catch (error) {
        lastError =
          error instanceof Error
            ? error.message
            : "Gemini image generation failed.";
      }
    }
  }

  throw new Error(lastError);
}

async function generateBannerImage(prompt: string) {
  const generators: Array<() => Promise<string>> = [];

  if (isUsableApiKey(process.env.OPENAI_API_KEY)) {
    generators.push(() => generateBannerWithOpenAI(prompt));
  }

  if (isUsableApiKey(process.env.STABILITY_API_KEY)) {
    generators.push(() => generateBannerWithStability(prompt));
  }

  if (getGeminiApiKeys().length > 0) {
    generators.push(() => generateBannerWithGemini(prompt));
  }

  let lastError = "Configure OpenAI, Stability, or Gemini keys to generate banners.";

  for (const generate of generators) {
    try {
      return await generate();
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Unable to generate banner.";
    }
  }

  throw new Error(lastError);
}

export async function POST(request: Request) {
  let body: GenerateBannerBody;

  try {
    body = (await request.json()) as GenerateBannerBody;
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const campaignText =
    typeof body.campaignText === "string" ? body.campaignText.trim() : "";

  if (!campaignText) {
    return Response.json(
      { error: "Campaign text is required." },
      { status: 400 },
    );
  }

  const prompt = buildBannerPrompt(campaignText);

  try {
    const imageUrl = await generateBannerImage(prompt);

    return Response.json({ imageUrl, prompt });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to generate banner.";

    return Response.json({ error: message }, { status: 502 });
  }
}
