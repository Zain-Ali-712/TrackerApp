export interface AIResult {
  calories: number;
  protein: number;
  carbs: number;
  estimatedMealName: string;
  isMock: boolean;
}

// Simple offline keyword matcher for local fallback testing
const estimateLocally = (mealText: string): AIResult => {
  const text = mealText.toLowerCase();
  let calories = 200;
  let protein = 5;
  let carbs = 20;
  let name = mealText;

  if (text.includes('paratha')) {
    const count = extractCount(text, 'paratha') || 1;
    calories = count * 350;
    protein = count * 6;
    carbs = count * 45;
    name = `${count}x Paratha`;
    
    if (text.includes('daal') || text.includes('dal')) {
      calories += 180;
      protein += 8;
      carbs += 22;
      name += ' with Daal';
    } else if (text.includes('egg') || text.includes('anda')) {
      calories += 80;
      protein += 6;
      carbs += 1;
      name += ' with Egg';
    }
  } else if (text.includes('roti') || text.includes('chapati')) {
    const count = extractCount(text, 'roti') || extractCount(text, 'chapati') || 1;
    calories = count * 120;
    protein = count * 4;
    carbs = count * 26;
    name = `${count}x Roti`;

    if (text.includes('daal') || text.includes('dal')) {
      calories += 180;
      protein += 8;
      carbs += 22;
      name += ' with Daal';
    } else if (text.includes('salan') || text.includes('chicken') || text.includes('curry')) {
      calories += 250;
      protein += 18;
      carbs += 8;
      name += ' with Salan';
    }
  } else if (text.includes('rice') || text.includes('chawal')) {
    calories = 350;
    protein = 7;
    carbs = 75;
    name = '1 Plate Rice';

    if (text.includes('chana') || text.includes('cholay')) {
      calories += 200;
      protein += 8;
      carbs += 30;
      name += ' with Black Chana Salan';
    } else if (text.includes('daal') || text.includes('dal')) {
      calories += 150;
      protein += 6;
      carbs += 20;
      name += ' with Daal';
    }
  } else if (text.includes('shake') || text.includes('milkshake')) {
    calories = 450;
    protein = 12;
    carbs = 65;
    name = 'Milkshake';
    if (text.includes('banana')) {
      const bananas = extractCount(text, 'banana') || 2;
      calories = 300 + (bananas * 105);
      protein = 10 + (bananas * 1.3);
      carbs = 40 + (bananas * 27);
      name = `Banana Milkshake (${bananas} bananas)`;
    }
  } else if (text.includes('egg') || text.includes('eggs') || text.includes('anda')) {
    const count = extractCount(text, 'egg') || extractCount(text, 'anda') || 1;
    calories = count * 75;
    protein = count * 6;
    carbs = count * 0.6;
    name = `${count}x Boiled/Fried Eggs`;
  } else if (text.includes('milk') || text.includes('doodh')) {
    calories = 150;
    protein = 8;
    carbs = 12;
    name = '1 Glass Milk';
  } else if (text.includes('banana') || text.includes('kela')) {
    const count = extractCount(text, 'banana') || extractCount(text, 'kela') || 1;
    calories = count * 105;
    protein = count * 1.3;
    carbs = count * 27;
    name = `${count}x Banana`;
  } else if (text.includes('tea') || text.includes('chai')) {
    calories = 90;
    protein = 2;
    carbs = 12;
    name = '1 Cup Desi Chai';
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    estimatedMealName: name,
    isMock: true
  };
};

const extractCount = (text: string, keyword: string): number | null => {
  const regex = new RegExp(`(\\d+)\\s*${keyword}`);
  const match = text.match(regex);
  if (match) {
    return parseInt(match[1], 10);
  }
  // Word numbers
  if (text.includes(`one ${keyword}`) || text.includes(`1 ${keyword}`)) return 1;
  if (text.includes(`two ${keyword}`) || text.includes(`2 ${keyword}`)) return 2;
  if (text.includes(`three ${keyword}`) || text.includes(`3 ${keyword}`)) return 3;
  if (text.includes(`four ${keyword}`) || text.includes(`4 ${keyword}`)) return 4;
  return null;
};

const chatLocally = (
  userMessage: string,
  currentMeals: any[],
  goals: { caloriesGoal: number; proteinGoal: number }
): string => {
  const query = userMessage.toLowerCase();
  const totalCalories = currentMeals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = currentMeals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = currentMeals.reduce((sum, m) => sum + m.carbs, 0);
  
  const calDeficit = goals.caloriesGoal - totalCalories;
  const protDeficit = goals.proteinGoal - totalProtein;
  
  // 1. Remaining day diet query
  if (query.includes('remaining') || query.includes('left') || query.includes('what should i') || query.includes('diet plan') || query.includes('suggest me') || query.includes('eat next')) {
    let advice = `Champion, you have logged **${totalCalories} kcal** and **${totalProtein}g protein** so far today. To hit your surplus goal of **${goals.caloriesGoal} kcal** and **${goals.proteinGoal}g protein**, you still need **${Math.max(0, calDeficit)} kcal** and **${Math.max(0, protDeficit)}g protein**.\n\n`;
    
    if (calDeficit <= 0 && protDeficit <= 0) {
      advice += `### 🎯 Goal Achieved!\nOutstanding discipline today! You have successfully achieved your daily calorie surplus and protein targets. No more heavy meals are required. Focus on recovery and getting 7-8 hours of sleep tonight!`;
    } else if (calDeficit > 1000) {
      advice += `### ⚠️ Large Deficit Detected (Need dense meals)\nYour remaining calorie gap is quite large (**${calDeficit} kcal**). You need heavy, nutrient-dense Desi meals:\n\n` +
                `1. **🍳 Heavy Breakfast/Meal**: 2 Parathas with 2 Fried Eggs + 1 Glass Banana Shake (~1000 kcal, ~24g protein).\n` +
                `2. **🍚 Dinner**: A plate of Beef/Chicken Biryani or Beef Pulao (~650 kcal, ~22g protein).\n` +
                `3. **🥤 High-Surplus Shake**: Prepare a banana milkshake with 3-5 bananas and 380ml milk (~600 kcal, ~16g protein).`;
    } else if (calDeficit > 500) {
      advice += `### 🍛 Moderate Deficit (Bridge the gap)\nYou need around **${calDeficit} kcal** to hit your goal. Here are the best options:\n\n` +
                `- **Option A**: 1.5 Roti with Chicken Salan (chicken curry) + 1 cup tea (~550 kcal, ~24g protein).\n` +
                `- **Option B**: 1 Plate rice with thick Black Chana Salan + 1 Boiled Egg (~550 kcal, ~18g protein).\n` +
                `- **Option C**: A large Banana Milkshake (milk + 3 bananas) (~500 kcal, ~14g protein).`;
    } else if (calDeficit > 200) {
      advice += `### 🥚 Small Deficit (Finishing strong)\nYou're very close! Add a light evening snack:\n\n` +
                `- **Option A**: 2 Boiled Eggs and a glass of milk (~300 kcal, ~20g protein).\n` +
                `- **Option B**: 1 Roti with half bowl of Daal Mash (~280 kcal, ~12g protein).\n` +
                `- **Option C**: 1 glass of Mango Milkshake (~400 kcal, ~11g protein).`;
    } else if (protDeficit > 15) {
      advice += `### 💪 Protein Target Focus\nYour calories are on track, but you are lagging on protein by **${protDeficit}g**. Boost your protein without eating heavy carbohydrates:\n\n` +
                `- **Option A**: 3 Boiled Egg Whites (~50 kcal, ~12g protein).\n` +
                `- **Option B**: 1 Glass of high-protein milk or greek yogurt (~180 kcal, ~12g protein).\n` +
                `- **Option C**: A small serving of chicken pieces or beef kabab (~150 kcal, ~15g protein).`;
    } else {
      advice += `### 🎯 Final Push!\nYou are almost there! Grab a small handful of mixed nuts or a cup of green tea with a banana (~150 kcal, ~3g protein) to lock in your day!`;
    }
    return advice;
  }
  
  // 2. Breakfast query
  if (query.includes('breakfast') || query.includes('morning') || query.includes('nashta')) {
    return `### 🍳 High-Protein Desi Breakfast Options\n\n` +
           `For your weight-gain and strength goals, here are the best breakfasts ranked:\n\n` +
           `1. 🥇 **Anda Paratha + Chana Combo**\n` +
           `   - **Items**: 1.5 homemade Parathas (mom's 26cm size) + 2 Fried Eggs + small bowl of chana salan.\n` +
           `   - **Nutrients**: ~900 kcal | **~30g protein**\n` +
           `   - *Why*: Gives you the raw calorie density from ghee/paratha and high-value protein from eggs and fiber from chickpeas.\n\n` +
           `2. 🥈 **Anda Paratha**\n` +
           `   - **Items**: 1.5 Paratha + 2 Fried/Omelet Eggs + Tea.\n` +
           `   - **Nutrients**: ~750 kcal | **~22g protein**\n\n` +
           `3. 🥉 **Chana Paratha**\n` +
           `   - **Items**: 1.5 Paratha + full serving chana daal (thick) + Tea.\n` +
           `   - **Nutrients**: ~700 kcal | **~18g protein**\n\n` +
           `💡 **Pro-Tip**: Heavy breakfasts (like paratha and daal) take time to digest. Avoid working out immediately after eating. Wait at least 1 to 1.5 hours to prevent sluggishness or heavy breathing during pushups!`;
  }
  
  // 3. Performance / Rating query
  if (query.includes('performance') || query.includes('rating') || query.includes('score') || query.includes('evaluate') || query.includes('today')) {
    let rating = '';
    let ratingColor = '';
    
    if (totalProtein < 70) {
      rating = 'Bad Day';
      ratingColor = 'Red 🔴';
    } else if (totalProtein < 75) {
      rating = 'Fair Day (Not a Bad Day)';
      ratingColor = 'Amber 🟡';
    } else if (totalProtein < 80) {
      rating = 'Average Day';
      ratingColor = 'Orange-Red 🟠';
    } else if (totalProtein < 90) {
      rating = 'Good Day';
      ratingColor = 'Yellow 🟡';
    } else if (totalProtein <= 100) {
      rating = 'Great Day (Goal Met!)';
      ratingColor = 'Neon Green 🟢';
    } else {
      rating = 'Elite Day (Surpassed!)';
      ratingColor = 'Cyan 🔵';
    }
    
    return `### 📊 Today's Diet Performance Review\n\n` +
           `Here is your direct evaluation for today:\n\n` +
           `- **Calories Intake**: **${totalCalories} kcal** / ${goals.caloriesGoal} kcal ` + (totalCalories >= goals.caloriesGoal ? '✅ (Surplus met)' : '⚠️ (Deficit)') + `\n` +
           `- **Protein Intake**: **${totalProtein}g** / ${goals.proteinGoal}g\n` +
           `- **Carbohydrates**: **${totalCarbs}g**\n` +
           `- **Protein Status Rating**: **${rating}** (${ratingColor})\n\n` +
           `### 📋 Meal Log Summary\n` +
           (currentMeals.length === 0 
             ? `No meals logged today yet. Type in a meal in the 'Progress' tab to log it!` 
             : currentMeals.map((m, i) => `${i+1}. **${m.meal_text}** (~${m.calories} kcal, ${m.protein}g protein)`).join('\n')
           ) + `\n\n` +
           `*Keep pushing, Champion! Every single day of consistency builds the foundation for strength and muscle.*`;
  }
  
  // 4. Mango / Banana shake query
  if (query.includes('shake') || query.includes('milkshake') || query.includes('mango') || query.includes('banana')) {
    return `### 🥤 High-Protein Desi Milkshakes\n\n` +
           `Milkshakes are your secret weapon for clean weight gain. They are easy to digest and packed with calories:\n\n` +
           `- **🍌 Banana Milkshake (Standard)**:\n` +
           `  - **Formula**: 380ml Whole Milk + 3-5 small Bananas.\n` +
           `  - **Nutrients**: ~500–750 kcal | **~13–18g protein**\n` +
           `  - *Tip*: Extremely good as a post-workout drink or mid-afternoon snack.\n\n` +
           `- **🥭 Mango Milkshake**:\n` +
           `  - **Formula**: Whole Milk + Fresh Mango pieces.\n` +
           `  - **Nutrients**: ~450–650 kcal | **~10–15g protein**\n\n` +
           `💡 **Pro-Tip**: If you struggle with bloating or gas from drinking shakes daily, try drinking them slowly or use lactose-free milk. Don't eat heavy oily foods (like Paratha or Roti) right after a milkshake!`;
  }
  
  // Default general response
  return `### 🦁 Salam, Champion!\n\n` +
         `I'm your **AI Diet Coach**, fully synchronized with your **Weight Gain & Muscle Building Plan**.\n\n` +
         `Here is what you have logged today so far:\n` +
         `- **Calories**: **${totalCalories} kcal** (Goal: ${goals.caloriesGoal} kcal)\n` +
         `- **Protein**: **${totalProtein}g** (Goal: ${goals.proteinGoal}g)\n\n` +
         `Today's Meals: ${currentMeals.length === 0 ? '_No meals logged yet_' : currentMeals.map(m => `\`${m.meal_text}\``).join(', ')}.\n\n` +
         `**What would you like to discuss?**\n` +
         `- Ask me: *'What should I take for the remaining day?'*\n` +
         `- Ask me: *'Suggest a high-protein breakfast'*\n` +
         `- Ask me: *'Evaluate today's protein rating'*`;
};

export const AIService = {
  async estimateMeal(mealText: string, apiKey?: string): Promise<AIResult> {
    if (!apiKey || apiKey.trim() === '') {
      // Return local fallback estimate if no key
      return estimateLocally(mealText);
    }

    try {
      const prompt = `Estimate the calories (kcal), protein (grams), and carbs (grams) for the following Pakistani/desi meal entry: "${mealText}".
Respond ONLY with a valid JSON object. Do not include any markdown format blocks or prefix/suffix. Just return raw JSON.
Example output format:
{
  "calories": 450,
  "protein": 18,
  "carbs": 55,
  "estimatedMealName": "2 Parathas with Daal Masoor"
}

Ensure your calculations are specific to Pakistani/desi items, e.g. a local paratha is around 300-350 calories, egg is 75-80, roti is 110-120, black chana salan is nutrient-dense, etc.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert nutritionist specialized in Pakistani and South Asian/desi diets. You estimate calories, protein, and carbs from meal descriptions and return clean JSON response.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('OpenAI HTTP error: 429');
        }
        throw new Error(`OpenAI HTTP Error: ${response.status}`);
      }

      const responseData = await response.json();
      const rawText = responseData.choices[0].message.content.trim();
      const parsed = JSON.parse(rawText);

      return {
        calories: Number(parsed.calories) || 0,
        protein: Number(parsed.protein) || 0,
        carbs: Number(parsed.carbs) || 0,
        estimatedMealName: parsed.estimatedMealName || mealText,
        isMock: false
      };
    } catch (error: any) {
      console.warn('AI service failed, falling back to local estimator:', error);
      // Fallback
      const local = estimateLocally(mealText);
      const is429 = error?.message?.includes('429') || false;
      return {
        ...local,
        estimatedMealName: is429 ? `${local.estimatedMealName} (Est. Fallback - 429 Limit)` : `${local.estimatedMealName} (Est. Fallback)`
      };
    }
  },

  async chatWithDietCoach(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    currentMeals: any[],
    goals: { caloriesGoal: number; proteinGoal: number },
    apiKey?: string
  ): Promise<{ text: string; error?: string }> {
    if (!apiKey || apiKey.trim() === '') {
      // Local fallback
      return { text: chatLocally(messages[messages.length - 1]?.content || '', currentMeals, goals) };
    }

    try {
      const systemPrompt = `You are an expert Desi Diet Coach and nutritionist.
Your user Zain is on a weight gain, strength, and muscle-building routine.
Goals:
- Calories target: ${goals.caloriesGoal} kcal (range: 2400-3000 kcal)
- Protein target: ${goals.proteinGoal}g (minimum 80g, 90g is goal)
- Carbs: nutrient dense.

Zain's preferred foods are Desi/Pakistani:
- Homemade paratha: size matters! Zain's mom makes 26cm diameter parathas, which are around 350-450+ kcal, 6-8g protein. Roti is 140-190 kcal.
- Omelet/fried/boiled eggs: 75-80 kcal, 6g protein each.
- Daal chana (thick daal) or dry boiled daal: protein-rich, 15-22g protein per bowl.
- Milkshakes: Banana milkshake (2.5 large or 5 small bananas + milk = ~500-750 kcal, 13-18g protein) is a key mid-day surplus driver. Mango shake is ~450-650 kcal, 10-15g protein.
- Lunch/Dinner: Chicken/Beef Pulao or Biryani, Matar Qeema, Beef Salan, Daal Chawal.
- Snacks: Burfi, Anda Shami Burger (1 egg + 1 shami kabab = ~350-500 kcal, 15g protein).

Today's logged meals for Zain:
${JSON.stringify(currentMeals, null, 2)}

Provide specific calorie and protein calculations for everything you suggest. Keep your responses highly conversational, friendly, encouraging, and clear, using bullet points and tables where appropriate. Act exactly like the shared ChatGPT Diet Coach. If the user asks for suggestions for the remaining day, calculate their current calorie and protein deficits and suggest exact meal options (e.g. eggs, shake, or pulao) to bridge the gap.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            ...messages
          ],
          temperature: 0.7
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('OpenAI HTTP error: 429');
        }
        throw new Error(`OpenAI HTTP Error: ${response.status}`);
      }

      const responseData = await response.json();
      const rawText = responseData.choices[0].message.content.trim();
      return { text: rawText };
    } catch (error: any) {
      console.warn('AI chat completions failed, falling back to local chat estimator:', error);
      const is429 = error?.message?.includes('429') || false;
      const localReply = chatLocally(messages[messages.length - 1]?.content || '', currentMeals, goals);
      return { 
        text: localReply, 
        error: is429 ? 'OpenAI HTTP error: 429' : error?.message || 'Error communicating with AI' 
      };
    }
  }
};
