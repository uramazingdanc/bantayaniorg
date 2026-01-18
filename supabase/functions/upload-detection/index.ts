import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub;

    // Parse form data (image upload) or JSON
    let detectionData: {
      pest_type: string;
      confidence: number;
      crop_type: string;
      latitude?: number;
      longitude?: number;
      location_name?: string;
      image_base64?: string;
    };

    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("image") as File | null;
      
      detectionData = {
        pest_type: formData.get("pest_type") as string,
        confidence: parseFloat(formData.get("confidence") as string),
        crop_type: formData.get("crop_type") as string,
        latitude: formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : undefined,
        longitude: formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : undefined,
        location_name: formData.get("location_name") as string | undefined,
      };

      // Upload image to storage if provided
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("detection-images")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          return new Response(
            JSON.stringify({ error: "Failed to upload image" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: publicUrl } = supabase.storage
          .from("detection-images")
          .getPublicUrl(fileName);

        (detectionData as any).image_url = publicUrl.publicUrl;
      }
    } else {
      // JSON body with base64 image
      const body = await req.json();
      detectionData = body;

      if (body.image_base64) {
        // Decode base64 and upload
        const base64Data = body.image_base64.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const fileName = `${userId}/${crypto.randomUUID()}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from("detection-images")
          .upload(fileName, imageBuffer, {
            contentType: "image/jpeg",
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          return new Response(
            JSON.stringify({ error: "Failed to upload image" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: publicUrl } = supabase.storage
          .from("detection-images")
          .getPublicUrl(fileName);

        (detectionData as any).image_url = publicUrl.publicUrl;
      }
    }

    // Insert detection record
    const { data: detection, error: insertError } = await supabase
      .from("pest_detections")
      .insert({
        user_id: userId,
        image_url: (detectionData as any).image_url || "",
        pest_type: detectionData.pest_type,
        confidence: detectionData.confidence,
        crop_type: detectionData.crop_type,
        latitude: detectionData.latitude,
        longitude: detectionData.longitude,
        location_name: detectionData.location_name,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save detection" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Detection created:", detection.id);

    return new Response(
      JSON.stringify({ success: true, detection }),
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
