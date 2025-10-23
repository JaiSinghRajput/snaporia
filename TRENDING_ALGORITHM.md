# 📊 Trending Posts Algorithm

## Overview
Snaporia uses a **hybrid trending algorithm** that combines engagement metrics with time decay to surface the most relevant and timely content.

## Algorithm Components

### 1. Time Window
- **Duration**: Last 7 days
- **Why**: Balances freshness with having enough data to calculate trends

### 2. Engagement Score (Weighted)
Posts are scored based on four engagement types:

```
Engagement Score = (views × 1) + (likes × 10) + (comments × 20) + (shares × 30)
```

**Weight Rationale:**
- **Views (1 point)**: Passive engagement, lowest weight
- **Likes (10 points)**: Active but light engagement
- **Comments (20 points)**: High-value engagement, shows conversation
- **Shares (30 points)**: Highest weight, indicates viral potential

**Example:**
```
Post with: 1000 views, 50 likes, 10 comments, 2 shares
Score = (1000 × 1) + (50 × 10) + (10 × 20) + (2 × 30)
      = 1000 + 500 + 200 + 60
      = 1,760 points
```

### 3. Time Decay Factor
Newer posts receive a boost to prevent old viral content from dominating:

```
Time Decay = 1 / (1 + hours_since_post / 24)
```

**Decay Curve:**
- **0-6 hours**: 80-100% of score (fresh content favored)
- **6-24 hours**: 50-80% of score (still relevant)
- **24-48 hours**: 33-50% of score (older but still recent)
- **48+ hours**: <33% of score (aging content)

### 4. Final Trending Score
```
Trending Score = Engagement Score × Time Decay Factor
```

## Examples

### Example 1: Fresh Viral Post
```
Post Age: 6 hours
Engagement: 500 views, 80 likes, 15 comments, 5 shares
Engagement Score = 500 + 800 + 300 + 150 = 1,750
Time Decay = 1 / (1 + 6/24) = 1 / 1.25 = 0.8
Trending Score = 1,750 × 0.8 = 1,400
```

### Example 2: Older Popular Post
```
Post Age: 48 hours
Engagement: 5000 views, 200 likes, 50 comments, 20 shares
Engagement Score = 5000 + 2000 + 1000 + 600 = 8,600
Time Decay = 1 / (1 + 48/24) = 1 / 3 = 0.33
Trending Score = 8,600 × 0.33 = 2,838
```

**Result**: Fresh post with moderate engagement can outrank older post with higher absolute numbers!

## Tuning Parameters

You can adjust these values in `/api/explore/trending-posts/route.ts`:

### Time Window
```typescript
const sevenDaysAgo = new Date()
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7) // Change 7 to adjust window
```

### Engagement Weights
```typescript
const engagementScore = 
  (views * 1) +      // Adjust view weight
  (likes * 10) +     // Adjust like weight
  (comments * 20) +  // Adjust comment weight
  (shares * 30)      // Adjust share weight
```

### Time Decay Speed
```typescript
const timeDecayFactor = 1 / (1 + hoursSincePost / 24) // Change 24 to adjust decay speed
```

**Slower Decay** (older posts stay trending longer):
```typescript
1 / (1 + hoursSincePost / 48) // Decay over 48 hours instead of 24
```

**Faster Decay** (favor very fresh content):
```typescript
1 / (1 + hoursSincePost / 12) // Decay over 12 hours
```

## Alternative Algorithms

### Reddit-Style "Hot" Algorithm
```typescript
const hoursOld = hoursSincePost
const score = Math.log10(Math.max(engagementScore, 1)) - hoursOld / 45000
```

### Twitter-Style "Top" Algorithm
```typescript
const score = engagementScore / Math.pow(hoursSincePost + 2, 1.5)
```

### Instagram-Style (Recent + Popular)
```typescript
const recentBoost = hoursSincePost < 24 ? 2 : 1
const score = engagementScore * recentBoost
```

## Performance Considerations

- **Calculation**: Done in-memory after fetching posts (fast)
- **Database Query**: Simple time filter only (indexed)
- **Caching**: Consider adding Redis cache for 5-10 minutes
- **Scalability**: Works well up to ~10,000 posts per week

## Future Enhancements

1. **Personalization**: Factor in user's interests and following
2. **Diversity**: Ensure trending isn't dominated by few users
3. **Geography**: Location-based trending
4. **Category**: Separate trending for different content types
5. **Velocity**: Track rate of engagement change (going viral right now)

## Monitoring

Track these metrics to tune the algorithm:
- Average time posts stay trending
- Diversity of authors in trending
- User engagement with trending vs regular feed
- Click-through rate from explore page
