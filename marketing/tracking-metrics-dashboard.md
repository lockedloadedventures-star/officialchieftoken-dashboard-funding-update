# Campaign Tracking & Metrics Dashboard

## Daily Tracking Template

Use this sheet to log metrics daily (Google Sheets template below).

### Gumroad Funnel Metrics

```
Date | Enrollments (Starter) | Enrollments (Growth) | Enrollments (Pro) | Total Revenue | Email List Growth | Notes
-----|----------------------|----------------------|-------------------|----------------|-------------------|------
6/4  | 12                   | 8                    | 2                 | $680           | 22                | Strong Day 1
6/5  | 8                    | 6                    | 1                 | $450           | 15                | Mid-week dip expected
6/6  | 15                   | 12                   | 3                 | $1,050         | 30                | Social proof post hit
```

**Formulas**:
- Total enrollments: SUM(Starter, Growth, Pro)
- Daily revenue: (Starter × $40) + (Growth × $100) + (Pro × $200)
- Tier mix: Each tier ÷ total enrollments = %
- Email CPA: Daily cost ÷ Email list growth = $/sub

### CHIEF Token Volume Metrics

```
Date  | Daily Volume (Uniswap) | Holder Count | New Holders | Liquidity Depth | Price USD | Notes
------|------------------------|--------------|-------------|-----------------|-----------|------
6/4   | $45,000                | 450          | 120         | $2.0M           | $0.18     | Launch day
6/5   | $62,000                | 620          | 170         | $2.1M           | $0.19     | Momentum building
6/6   | $78,000                | 890          | 270         | $2.2M           | $0.21     | Social proof post
```

**Formulas**:
- Growth rate: (Today's volume - Yesterday's) ÷ Yesterday's = %
- Average daily volume (7-day): SUM(last 7 days) ÷ 7
- Liquidity efficiency: Daily volume ÷ Liquidity depth = ratio
- Holder growth: New holders ÷ previous day = % growth
- Price momentum: (Today - 7d ago) ÷ 7d ago = % gain

### Paid Advertising Metrics

```
Date  | Platform | Ad Spend | Clicks | Traffic | Conversions | CPC | CPA | ROAS | Notes
------|----------|----------|--------|---------|-------------|-----|-----|------|------
6/4   | IG       | $100     | 45     | 42      | 8           | $2.22 | $12.50 | 6.8x | Chart creative
6/5   | IG       | $100     | 38     | 35      | 5           | $2.63 | $20 | 4.5x | Founder video
```

**Formulas**:
- CPC (cost per click): Ad spend ÷ Clicks
- CTR (click-through rate): Clicks ÷ Impressions
- CPA (cost per acquisition): Ad spend ÷ Conversions
- ROAS (return on ad spend): Revenue from ad ÷ Ad spend
- Cost per USD revenue: Ad spend ÷ Revenue

### Email & Community Metrics

```
Date  | Discord Members | Twitter Followers | Email Opens | Email Clicks | Utility Pass Signups | Notes
------|-----------------|-------------------|-------------|--------------|----------------------|------
6/4   | 350             | 2,100             | 45          | 12           | 2                    | Week 1 launch
6/5   | 420             | 2,200             | 62          | 18           | 3                    | Growth Day 2
```

**Formulas**:
- Discord growth: (Today - Yesterday) = new members
- Email open rate: Opens ÷ Emails sent = %
- Email click rate: Clicks ÷ Opens = %
- Email conversion rate: Signups ÷ Clicks = %
- Community engagement: Messages ÷ Members = activity level

---

## Weekly Summary Report

### Revenue Dashboard

| Category | Target | Actual | Variance | Notes |
|----------|--------|--------|----------|-------|
| Gumroad (Starter) | $1,200 | $1,340 | +11% | Strong tier mix |
| Gumroad (Growth) | $1,200 | $1,480 | +23% | Upsell working |
| Gumroad (Pro) | $400 | $420 | +5% | On track |
| Utility Pass | $300 | $174 | -42% | Ramp in Week 2 |
| **Total** | **$3,100** | **$3,414** | **+10%** | Week 1 win |

### Cost Summary

| Item | Budget | Actual | Efficiency |
|------|--------|--------|------------|
| Paid ads (IG/Meta) | $700 | $500 | $1 spend : $6.83 revenue |
| Email service | $50 | $50 | $0.015 per subscriber |
| Discord tools | $50 | $50 | Free tier used |
| Content creation | $200 | $0 | DIY content |
| **Total Spend** | **$1,000** | **$600** | **5.7x ROAS** |

### Profitability

```
Total Revenue:        $3,414
Total Ad Spend:       $600
Total Other Costs:    $100
---
Gross Profit:        $2,714
Profit Margin:       79.5%
```

---

## Key Performance Indicators (KPIs)

### Gumroad Funnel KPIs

| KPI | Week 1 Target | Week 2 Target | Success Criteria |
|-----|--------------|--------------|------------------|
| Total enrollments | 50 | 120 | >50% week-over-week growth |
| Starter % | 35-40% | 35-40% | Consistent tier mix |
| Growth % | 40-45% | 40-45% | "Growth recommended" working |
| Pro % | 15-20% | 15-20% | Premium tier stable |
| Email list | 150 | 400 | 2x growth |
| Email open rate | >35% | >40% | Increasing engagement |
| Utility Pass conversion | 5% | 20% | Cross-sell improving |

**Red flag**: Utility Pass conversion < 5% → Review email messaging

### CHIEF Token KPIs

| KPI | Week 1 Target | Week 2 Target | Success Criteria |
|-----|--------------|--------------|------------------|
| Daily volume | $50k | $150k | 3x growth |
| Holder count | 500 | 1,200 | 2.4x growth |
| Liquidity depth | $2M+ | $2.5M+ | Sustainable trading |
| Price | $0.18+ | $0.20+ | 11%+ appreciation |
| New holders/day | 100+ | 200+ | Viral adoption |
| Holder retention | >85% | >80% | Minimal churn |

**Red flag**: Holder retention < 70% → Community concern, investigate

### Ad Performance KPIs

| KPI | Target | Threshold | Action |
|-----|--------|-----------|--------|
| CPA (Gumroad) | <$15 | >$25 | Kill ad, pivot creative |
| ROAS | >3x | <2x | Cut budget, test new angle |
| CTR | >2% | <1% | Refresh creative |
| Email CPA | <$2 | >$5 | Organic only, no ads |

---

## Weekly Dashboard (Google Sheets Example)

```
WEEK 1 PERFORMANCE (June 4-10)

GUMROAD FUNNEL
├─ Total Enrollments: 52 (Target: 50) ✓ +4%
├─ Revenue: $3,680
├─ Email Growth: 127 (Target: 150) ~ -15%
└─ Utility Pass (early): 2 / 52 = 3.8%

CHIEF TOKEN PUSH
├─ Avg Daily Volume: $62,400 (Target: $50k) ✓ +25%
├─ Holder Count: 780 (Target: 500) ✓ +56%
├─ Liquidity Depth: $2.15M (Target: $2M+) ✓
└─ Price: $0.20 USD (Target: $0.18+) ✓ +11%

PAID ADVERTISING
├─ Total Spend: $600 (Budget: $700) ✓ -14%
├─ ROAS: 5.7x (Target: 3x+) ✓ +90%
├─ CPA: $11.54 (Target: <$15) ✓
└─ Email Cost: $1.89/sub (Target: <$2) ✓

COMMUNITY
├─ Discord: 720 members (Target: 500) ✓ +44%
├─ Twitter: 2,400 followers (Target: 2k) ✓ +20%
└─ Email List: 127 subscribers

PROFITABILITY
├─ Gross Revenue: $3,680
├─ Ad Spend: $600
├─ Profit: $3,080
└─ ROI: 414% ✓

WEEK 1 VERDICT: EXCEED ALL TARGETS
Next week: Scale ad spend to $1.5k, launch Week 2 initiatives
```

---

## Tracking Tools (Recommended)

### Free/Cheap Options
1. **Google Sheets**: Daily tracking + auto-calculated dashboards
   - Template: Create formulas for all metrics above
   - Share link: Accessible from phone/desktop
   
2. **DEXTools**: Track CHIEF volume + holder count
   - URL: https://www.dextools.io/app/base/pair/0xD926F4C2b5ad4de45E31C875d33d5207e3Df3A7d

3. **Gumroad Dashboard**: Built-in stats
   - Email: All creator stats sent daily

4. **Meta Ads Manager**: Automatic ad tracking
   - CPA, ROAS, CTR all visible in-platform

5. **Discord Bots**: Auto-track members
   - Bot: MEE6 (free tier) or custom

### Setup (30 min)
1. Create Google Sheet with tabs: Daily | Weekly | Dashboard
2. Set up formulas for auto-calculation
3. Link to DEXTools, Gumroad, Meta Ads Manager
4. Schedule 5-min daily update (morning)
5. Weekly review (Friday 5pm)

---

## Interpretation Guide

### Green Light (Keep going)
- CPA < $15 ✓
- ROAS > 3x ✓
- Email open rate > 35% ✓
- CHIEF daily volume > $100k ✓
- Holder retention > 80% ✓

### Yellow Light (Monitor closely)
- CPA $15-25 ⚠️
- ROAS 2-3x ⚠️
- Email open rate 25-35% ⚠️
- CHIEF daily volume $50k-100k ⚠️
- Holder retention 70-80% ⚠️

### Red Light (Take action immediately)
- CPA > $25 🛑
- ROAS < 2x 🛑
- Email open rate < 25% 🛑
- CHIEF daily volume < $50k 🛑
- Holder retention < 70% 🛑

---

## Monthly Reporting

**Report Due**: First Monday of month

```
MONTH 1 PERFORMANCE (June 1-30, 2026)

REVENUE
├─ Gumroad: $15,420 (200 enrollments avg $77 AOV)
├─ Utility Pass: $2,900 (100 members × $29/mo)
├─ CHIEF Trading (none, organic only)
└─ TOTAL: $18,320

COSTS
├─ Paid advertising: $3,500
├─ Tools/services: $500
├─ Content creation: $1,200
└─ TOTAL: $5,200

PROFIT: $13,120 (71% margin)

GROWTH
├─ Email list: 450 subscribers (9x organic growth)
├─ Discord: 2,800 members
├─ CHIEF holders: 4,200
├─ Utility Pass members: 100

KEY WINS
1. Week 1 exceeded all targets (+25% revenue)
2. CHIEF volume hit $500k daily (target met)
3. Paid ads hit 5.7x ROAS (exceptional)
4. Community organic growth (9x without incentives)

NEXT MONTH PRIORITIES
1. Scale paid to $1k/day (volume support)
2. Launch referral affiliate program (viral loop)
3. Partnerships with 5 micro-influencers
4. Weekly Twitter Spaces (community engagement)
```

