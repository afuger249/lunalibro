# Business Model & Cost Analysis: LunaLibro

This document outlines the estimated costs for operating LunaLibro, both for personal use and as a commercial product.

## 1. Projected Operating Costs (Overhead)
These are fixed or base monthly costs required to keep the app live and production-ready.

| Service | Tier | Monthly Cost (Est.) | Purpose |
| :--- | :--- | :--- | :--- |
| **Supabase** | Pro | $25.00 | Production database, Auth, 100GB Storage. |
| **Leonardo.ai** | Standard | $27.00 | 25,000 API credits/mo (~150 books). |
| **ElevenLabs** | Creator | $22.00 | 100,000 characters/mo (~30 books). |
| **OpenAI** | Usage-based | ~$5.00 | GPT-4o story generation. |
| **Apple Developer**| Individual | $8.25 | App Store distribution ($99/year). |
| **Google Play** | Individual | $0.00 | One-time $25 fee (ignored for monthly). |
| **TOTAL** | | **~$87.25** | **Monthly overhead to run the business.** |

---

## 2. Unit Cost per Book
Estimated cost to generate **one 10-page book** with professional narration and character consistency.

*   **Story (GPT-4o)**: ~$0.02 (3k total tokens)
*   **Images (Leonardo)**: ~$0.18 (11 images @ 15 credits/ea)
*   **Voice (Azure AI)**: **~$0.05** (3k characters @ $16/1M chars)
*   **UNIT TOTAL**: **~$0.25 per book** (Saving ~$0.61 vs ElevenLabs)

---

## 3. Voice Logic: ElevenLabs vs. Azure
If quality is the priority, ElevenLabs wins. If **margins and scale** are the priority, Azure is the clear winner for children's books.

| Provider | Audio Quality | Cost / 1M Characters | Unit Cost (10pg Book) | Savings |
| :--- | :--- | :--- | :--- | :--- |
| **ElevenLabs** | Ultra-Expressive | ~$220.00 (Creator) | ~$0.66 | - |
| **Azure AI** | High-Quality Neural | $16.00 | **$0.05** | **92%** |

> [!TIP]
> **Azure Savings Impact**: Switching to Azure saves you **$0.61 per book**. 
> For 1,000 books, that's **$610 in pure profit** added back to your pocket.

---

## 4. Financial Scenarios

### **Scenario A: Personal Use (You & Kids)**
*   **Usage**: 10 books / month.
*   **Cost**: $87.25 (Overhead) + $8.60 (Usage) = **$95.85 / mo**.
*   *Note: Using the "Free" tiers of Supabase and Leonardo could drop this to ~$0 - $15, but with significant quality/reliability tradeoffs.*

### **Scenario B: Commercial Scaling**
To scale to the world, we must account for the **App Store Cut (15% for Small Business)**.

| Pricing Tier | Gross Price | Apple Fee (15%) | Net Revenue | Unit Cost | Profit/Book |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Boutique** | $4.99 | $0.75 | $4.24 | $0.86 | **$3.38** |
| **Premium** | $9.99 | $1.50 | $8.49 | $0.86 | **$7.63** |

---

## 5. Path to Profit Targets
How many books must you sell to reach these net profit targets (after overhead and Apple fees)?

> [!IMPORTANT]
> Calculated using **Azure Voice** at **$4.99 per book** price point (~$3.99 profit/book).

| Annual Profit Goal | Monthly Net Profit | Books Sold / Month |
| :--- | :--- | :--- |
| **Break Even** | $0 | ~22 books |
| **$10,000** | $833 | ~230 books |
| **$25,000** | $2,083 | ~543 books |
| **$50,000** | $4,166 | ~1,065 books |
| **$100,000** | $8,333 | ~2,110 books |

---

## 6. Subscription Model Alternatives
To reach **$100,000 annual profit** ($8,333/mo net profit), here is how many active subscribers you would need for different pricing tiers.

*Calculations include Apple’s 15% fee, $87/mo overhead, and Azure voice costs ($0.25/book).*

| Model | Price / Mo | Stories / Mo | Profit / User | Subs for $100k |
| :--- | :--- | :--- | :--- | :--- |
| **"The Starter"** | **$9.99** | 10 | $5.99 | **~1,406** |
| **"The Entry"** | **$4.99** | 3 | $3.49 | **~2,413** |
| **"The Family"** | **$14.99** | 20 | $7.74 | **~1,088** |
| **"Unlimited"** | **$19.99** | Unlimited* | $13.24 | **~636** |

> [!NOTE]
> *Unlimited is modeled at an average usage of 15 stories per month.

---

## 7. Recommendations for Scale
1.  **Iterative Pricing**: Start with **"The Starter" ($9.99)** as it’s the most competitive psychological price point.
2.  **Tiered Upsell**: Offer the **"Family Plan"** specifically to users who use the multi-character (2 kids + dog) feature.
3.  **Cost Optimization**: At scale, moving to Leonardo's "Pro" Plan and using GPT-4o Mini can drop your unit cost to **~$0.15**, increasing your margins significantly.
