// Database types for pg-salon-app

export type BodyType = 'fat_sensitive' | 'carb_sensitive';
export type CourseType = '5w' | '7w' | '9w';
export type PgStatus = 'ok' | 'ng' | 'limited';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Client {
  id: string;
  line_user_id: string | null;
  display_name: string;
  picture_url: string | null;
  body_type: BodyType | null;
  height_cm: number | null;
  start_weight_kg: number | null;
  target_weight_kg: number | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  client_id: string;
  course_type: CourseType;
  start_date: string;
  end_date: string;
  is_repeat: boolean;
  total_price: number;
  massage_price: number;
  knowhow_price: number;
  advice_price: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Treatment {
  id: string;
  course_id: string;
  client_id: string;
  session_number: number;
  scheduled_at: string | null;
  performed_at: string | null;
  weight_before_kg: number | null;
  weight_after_kg: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeightLog {
  id: string;
  client_id: string;
  logged_date: string;
  slot: 'morning' | 'evening' | 'unknown';
  weight_kg: number;
  source: string;
  created_at: string;
}

export interface Food {
  id: string;
  name: string;
  name_kana: string | null;
  category: string | null;
  serving_g: number;
  protein_g: number;
  fat_g: number;
  carb_g: number;
  calories_kcal: number;
  pg_status: PgStatus;
  pg_note: string | null;
  fat_sensitive_ok: boolean;
  carb_sensitive_ok: boolean;
  created_at: string;
  updated_at: string;
}

export interface MealReport {
  id: string;
  client_id: string;
  report_date: string;
  day_number: number | null;
  total_protein_g: number;
  total_fat_g: number;
  total_carb_g: number;
  total_calories_kcal: number;
  water_ml: number | null;
  is_complete: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface MealEntry {
  id: string;
  meal_report_id: string;
  food_id: string | null;
  meal_type: MealType;
  food_name: string;
  quantity_g: number;
  protein_g: number;
  fat_g: number;
  carb_g: number;
  calories_kcal: number;
  created_at: string;
}

export interface MealPhoto {
  id: string;
  meal_report_id: string;
  meal_type: MealType;
  storage_path: string;
  public_url: string | null;
  created_at: string;
}

export interface Followup {
  id: string;
  client_id: string;
  course_id: string | null;
  day_number: number;
  sent_at: string | null;
  channel: string;
  message: string;
  response: string | null;
  created_at: string;
}

type GenericRow = Record<string, any>;
type Table<Row> = { Row: Row; Insert: GenericRow; Update: GenericRow; Relationships: [] };

export interface Database {
  public: {
    Tables: {
      clients: Table<Client>;
      courses: Table<Course>;
      treatments: Table<Treatment>;
      weight_logs: Table<WeightLog>;
      foods: Table<Food>;
      meal_reports: Table<MealReport>;
      meal_entries: Table<MealEntry>;
      meal_photos: Table<MealPhoto>;
      followups: Table<Followup>;
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
