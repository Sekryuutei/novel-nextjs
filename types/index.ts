// types/index.ts
import { User, Novel, Chapter, Purchase, Account, Session } from "@prisma/client";

// Extended types untuk aplikasi
export type UserRole = "READER" | "AUTHOR" | "ADMIN";
export type NovelStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "COMPLETED";
export type PurchaseStatus = "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED" | "CANCELLED";

// User types
export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  bio: string | null;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithNovels extends User {
  novels: Novel[];
  authoredNovels: Novel[];
}

// Novel types
export interface NovelWithChapters extends Novel {
  chapters: Chapter[];
  author: SafeUser;
  _count?: {
    chapters: number;
    purchases: number;
  };
}

export interface NovelWithPurchaseStatus extends NovelWithChapters {
  isPurchased?: boolean;
  readingProgress?: number;
}

// Chapter types
export interface ChapterWithNovel extends Chapter {
  novel: Novel;
  choices: Choice[];
}

export interface ChapterWithBranching extends ChapterWithNovel {
  nextChapters: Chapter[];
  parentChapter?: Chapter;
}

// Interactive Narrative types
export interface Choice {
  id: string;
  text: string;
  nextChapterId: string;
  nextChapter?: Chapter;
}

export interface BranchingPath {
  fromChapterId: string;
  toChapterId: string;
  choiceText: string;
}

// Reading Experience types
export interface ReadingPreferences {
  fontSize: number;
  theme: 'light' | 'dark' | 'sepia';
  lineHeight: number;
  fontFamily: string;
  autoPlayMusic: boolean;
  showProgress: boolean;
}

export interface MultimediaContent {
  backgroundMusic?: string;
  soundEffects?: string[];
  customBackground?: string;
  animations?: string[];
}

// Payment types
export interface PaymentRequest {
  novelId?: string;
  chapterId?: string;
  userId: string;
  amount: number;
  paymentMethod: "credit_card" | "gopay" | "bank_transfer" | "qris";
}

export interface PaymentResponse {
  success: boolean;
  snapToken?: string;
  redirectUrl?: string;
  error?: string;
  orderId?: string;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: UserRole;
}

export interface NovelFormData {
  title: string;
  description: string;
  content: string;
  coverImage?: string;
  genre: string[];
  tags: string[];
  isPublished: boolean;
  isPremium: boolean;
  price?: number;
  hasBranching: boolean;
  backgroundMusic?: string;
  customBackground?: string;
  customFont?: string;
}

export interface ChapterFormData {
  title: string;
  content: string;
  chapterNumber: number;
  isPremium: boolean;
  price?: number;
  backgroundMusic?: string;
  customBackground?: string;
  soundEffects: string[];
  choices: ChoiceFormData[];
}

export interface ChoiceFormData {
  text: string;
  nextChapterId: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// NextAuth type extensions
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    id: string;
  }
}