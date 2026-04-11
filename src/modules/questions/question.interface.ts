export type Question = {
    productId: string;
    userId: string;
    question: string;
    answer?: string | null; // Admin can answer this
    createdAt: Date;
  };
  