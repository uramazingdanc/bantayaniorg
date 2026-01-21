import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Target pests for detection - primarily armyworm species and related pests
const TARGET_PESTS = [
  { name: "Beet Armyworm", scientificName: "Spodoptera exigua", description: "Primary target - eggs and egg clusters on onion leaves" },
  { name: "Fall Armyworm", scientificName: "Spodoptera frugiperda", description: "Major agricultural pest affecting corn and other crops" },
  { name: "African Armyworm", scientificName: "Spodoptera exempta", description: "Migratory pest affecting cereals and grasses" },
  { name: "Maize Stalk Borer", scientificName: "Busseola fusca", description: "Stem borer affecting maize and sorghum" },
  { name: "Rice Stem Borer", scientificName: "Scirpophaga incertulas", description: "Major rice pest in tropical regions" },
  { name: "Brown Planthopper", scientificName: "Nilaparvata lugens", description: "Sap-sucking pest of rice" },
  { name: "Leaf Folder", scientificName: "Cnaphalocrocis medinalis", description: "Foliar pest of rice" },
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { image_base64, crop_type } = body;

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean base64 data
    const cleanBase64 = image_base64.replace(/^data:image\/\w+;base64,/, "");

    console.log("Analyzing image for pest detection...");

    // Build the prompt for pest detection
    const systemPrompt = `You are an expert agricultural entomologist AI specialized in pest detection, particularly armyworm species. Your primary focus is on detecting:

1. **Beet Armyworm (Spodoptera exigua)** - PRIMARY TARGET
   - Look for: Egg masses (white/pale, fuzzy covering), larvae (green with pale stripes), adults (gray-brown moths)
   - Common on: Onion, lettuce, tomato, peppers

2. **Fall Armyworm (Spodoptera frugiperda)**
   - Look for: Larvae with inverted Y on head, darker coloring
   - Common on: Corn, rice, sorghum

3. **African Armyworm (Spodoptera exempta)**
   - Look for: Gregarious larvae, darker phase when crowded
   - Common on: Cereals, grasses

4. **Maize Stalk Borer (Busseola fusca)**
   - Look for: Larvae boring into stems, frass visible
   - Common on: Maize, sorghum

Also detect other common agricultural pests like Rice Stem Borer, Brown Planthopper, and Leaf Folder.

Analyze the image and determine if any pests are present.`;

    const userPrompt = `Analyze this image from a ${crop_type || "crop"} field. 

Respond with a JSON object containing:
{
  "detected": true/false,
  "pest_name": "Common name of the pest" or "None",
  "scientific_name": "Scientific name" or null,
  "confidence": 0.0-1.0 (your confidence level),
  "life_stage": "egg/larva/pupa/adult" or null,
  "severity": "low/medium/high" or null,
  "description": "Brief description of what you see",
  "recommendations": ["Array of recommended actions"]
}

Be conservative - only report high confidence detections. If unsure, set detected to false.`;

    // Call Lovable AI Gateway with vision capability
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${cleanBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1024,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted, please add credits" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "AI returned no analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI Response:", content);

    // Parse the JSON response from AI
    let detectionResult;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      detectionResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a fallback response
      detectionResult = {
        detected: false,
        pest_name: "Unknown",
        confidence: 0,
        description: "Unable to analyze image",
        recommendations: ["Please try capturing a clearer image"],
      };
    }

    console.log("Detection result:", detectionResult);

    return new Response(
      JSON.stringify({
        success: true,
        detection: {
          detected: detectionResult.detected || false,
          pest_type: detectionResult.pest_name || "None",
          scientific_name: detectionResult.scientific_name || null,
          confidence: Math.round((detectionResult.confidence || 0) * 100) / 100,
          life_stage: detectionResult.life_stage || null,
          severity: detectionResult.severity || null,
          description: detectionResult.description || "",
          recommendations: detectionResult.recommendations || [],
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
