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
    } catch (error) {
      console.warn('AI service failed, falling back to local estimator:', error);
      // Fallback
      const local = estimateLocally(mealText);
      return {
        ...local,
        estimatedMealName: `${local.estimatedMealName} (Est. Fallback)`
      };
    }
  }
};
