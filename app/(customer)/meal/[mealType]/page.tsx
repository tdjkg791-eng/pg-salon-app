"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import FoodSearch from "@/components/customer/FoodSearch";
import FoodAddPanel from "@/components/customer/FoodAddPanel";
import type { Food, BodyType } from "@/lib/supabase/types";

// TODO: replace with authenticated client id from LIFF
const DEMO_CLIENT_ID = "00000000-0000-0000-0000-000000000001";
const PHOTO_BUCKET = "meal-photos";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const LABEL: Record<MealType, string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
};

type Entry = {
  id: string;
  food_name: string;
  quantity_g: number;
  protein_g: number | null;
  fat_g: number | null;
  carb_g: number | null;
  kcal: number | null;
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function MealDetailPage() {
  const params = useParams<{ mealType: string }>();
  const router = useRouter();
  const mealType = params?.mealType as MealType;
  const label = LABEL[mealType] ?? "食事";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [bodyType, setBodyType] = useState<BodyType | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [eRes, cRes] = await Promise.all([
        supabase
          .from("meal_entries")
          .select("*")
          .eq("client_id", DEMO_CLIENT_ID)
          .eq("date", todayStr())
          .eq("meal_type", mealType),
        supabase
          .from("clients")
          .select("body_type")
          .eq("id", DEMO_CLIENT_ID)
          .maybeSingle(),
      ]);
      if (eRes.data) setEntries(eRes.data as any);
      if (cRes.data) setBodyType((cRes.data as any).body_type ?? null);
    } catch (e: any) {
      setError(e?.message ?? "読み込みエラー");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealType]);

  const handleAdd = async ({
    food,
    quantityG,
    pfc,
  }: {
    food: Food;
    quantityG: number;
    pfc: { protein: number; fat: number; carb: number };
  }) => {
    if (!supabase) return;
    try {
      const kcal = Math.round(pfc.protein * 4 + pfc.fat * 9 + pfc.carb * 4);
      const { error: insErr } = await supabase.from("meal_entries").insert({
        client_id: DEMO_CLIENT_ID,
        date: todayStr(),
        meal_type: mealType,
        food_id: (food as any).id,
        food_name: food.name,
        quantity_g: quantityG,
        protein_g: pfc.protein,
        fat_g: pfc.fat,
        carb_g: pfc.carb,
        kcal,
      });
      if (insErr) throw insErr;
      setSelectedFood(null);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "登録に失敗しました");
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    try {
      await supabase.from("meal_entries").delete().eq("id", id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (e: any) {
      setError(e?.message ?? "削除に失敗しました");
    }
  };

  const handlePhoto = async (file: File) => {
    if (!supabase) return;
    setUploading(true);
    try {
      const path = `${DEMO_CLIENT_ID}/${todayStr()}/${mealType}-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, file);
      if (upErr) throw upErr;
    } catch (e: any) {
      setError(e?.message ?? "写真のアップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center border-b border-[#E8E6DF] bg-white px-4 py-3">
        <Link href="/meal" className="mr-2.5 text-xl text-[#888]">
          ←
        </Link>
        <div className="flex-1 text-[15px] font-semibold">{label}</div>
      </header>

      {loading && (
        <div className="mx-3 mt-3 text-center text-xs text-[#888]">
          読み込み中…
        </div>
      )}
      {error && (
        <div className="mx-3 mt-2 rounded-lg bg-[#FCEBEB] p-2 text-xs text-pg-red">
          {error}
        </div>
      )}

      {!loading && (
        <>
          <div className="mx-3 mt-3 text-[11px] font-semibold text-[#888]">
            記録済み
          </div>
          {entries.length === 0 ? (
            <div className="mx-3 mt-1.5 rounded-[10px] border border-[#E8E6DF] bg-white px-3 py-3 text-xs text-[#888]">
              まだ記録がありません
            </div>
          ) : (
            <ul className="mt-1.5">
              {entries.map((e) => (
                <li
                  key={e.id}
                  className="mx-3 mb-1.5 flex items-center justify-between rounded-[10px] border border-[#E8E6DF] bg-white px-3 py-2.5"
                >
                  <div>
                    <div className="text-xs font-medium">{e.food_name}</div>
                    <div className="text-[10px] text-[#888]">
                      {e.quantity_g}g ・ P{(e.protein_g ?? 0).toFixed(1)} / F
                      {(e.fat_g ?? 0).toFixed(1)} / C{(e.carb_g ?? 0).toFixed(1)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">
                      {e.kcal ?? 0} kcal
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(e.id)}
                      className="text-base text-[#ccc]"
                      aria-label="削除"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mx-3 mt-3 text-[11px] font-semibold text-[#888]">
            食品を追加
          </div>
          <div className="mt-1.5">
            <FoodSearch onSelect={setSelectedFood} bodyType={bodyType} />
          </div>

          {selectedFood && (
            <div className="mt-2">
              <FoodAddPanel
                food={selectedFood}
                bodyType={bodyType}
                onAdd={handleAdd}
                onCancel={() => setSelectedFood(null)}
              />
            </div>
          )}

          <label className="mx-3 mt-3 block cursor-pointer rounded-[12px] border border-dashed border-[#D3D1C7] bg-white px-3 py-3 text-center text-xs text-[#888]">
            {uploading ? "アップロード中…" : "写真を追加"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhoto(file);
              }}
            />
          </label>
        </>
      )}
    </>
  );
}
