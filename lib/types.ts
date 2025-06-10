// Interfaces pour Toilet, Comment, User et les types associés

export type ToiletStatus = "available" | "occupied" | "out_of_order";
export type ToiletFeature =
  | "wheelchair_accessible"
  | "baby_changing"
  | "gender_neutral"
  | "free"
  | "requires_key"
  | "24h";

export interface Toilet {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: ToiletStatus;
  features: ToiletFeature[];
  rating: number;
  addedBy: string;
  addedAt: string;
  updatedAt: string;
}

export interface Comment {
  content: string;
  id: string;
  toiletId: string;
  userId: string;
  userName: string;
  userImage: string;
  text: string;
  rating: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string;
}

export interface Like {
  toiletId: string;
  userId: string;
  type: "like" | "dislike";
}
