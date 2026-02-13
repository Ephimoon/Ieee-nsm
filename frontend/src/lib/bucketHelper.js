import { supabase } from "../lib/supabaseClient";

const BUCKET = "profile-images";

export async function uploadProfileImage(file) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) throw new Error("Not signed in");

  // make a safe filename
  const ext = file.name.split(".").pop();
  const path = `${user.id}/profile.${ext}`;

  // upload to bucket
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  // save path to profiles table
  const { error: dbError } = await supabase
    .from("profiles")
    .update({ image_path: path })
    .eq("id", user.id);

  if (dbError) throw dbError;

  return path;
}

// generate the URL
export function getPublicImageUrl(path) {
  if (!path) return null;
  return supabase.storage.from("profile-images").getPublicUrl(path).data.publicUrl;
}