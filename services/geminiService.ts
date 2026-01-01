
import { GoogleGenAI } from "@google/genai";

// Teff product information
const TEFF_INFO = {
  types: [
    {
      name: 'White Teff',
      amharic: 'ነጭ ጤፍ',
      description: {
        en: 'Premium white teff with fine texture and mild flavor, ideal for traditional injera.',
        am: 'የፕሬሚየም ነጭ ጤፍ በብልጭታው ጥራቱ እና በሚያስደስት ጣዕሙ የታወቀ። ለባህላዊ እንጀራ ተስማሚ።'
      },
      bestFor: {
        en: 'Ideal for injera, porridge, and traditional beverages',
        am: 'ለእንጀራ፣ ገንፎ እና ባህላዊ መጠጦች ተስማሚ'
      },
      storage: {
        en: 'Store in a cool, dry place in an airtight container for up to 1 year',
        am: 'በማቀዝቀዣ እና ደረቅ ቦታ በአየር-ጠባቂ ዕቃ ውስጥ እስከ 1 ዓመት ድረስ ያከማቹ'
      },
      priceRange: {
        en: 'Premium quality: 120-150 ETB/kg',
        am: 'የፕሬሚየም ጥራት፦ 120-150 ብር/ኪ.ግ.'
      }
    },
    {
      name: 'Red Teff',
      amharic: 'ቀይ ጤፍ',
      description: {
        en: 'Nutrient-rich red teff with a slightly earthy flavor, packed with iron and minerals.',
        am: 'በብረታ ብረት እና ማዕድናት የበለፀገ ቀይ ጤፍ በቀላሉ የሚመረት እና በጤና ጠቃሚ ጥቅሞቹ የታወቀ።'
      },
      bestFor: {
        en: 'Great for porridge, bread, and as a rice substitute',
        am: 'ለገንፎ፣ ዳቦ እና ሩዝ ምትክ ጥሩ ነው'
      },
      storage: {
        en: 'Store in a cool, dry place in an airtight container for up to 1 year',
        am: 'በማቀዝቀዣ እና ደረቅ ቦታ በአየር-ጠባቂ ዕቃ ውስጥ እስከ 1 ዓመት ድረስ ያከማቹ'
      },
      priceRange: {
        en: 'Standard quality: 100-130 ETB/kg',
        am: 'መደበኛ ጥራት፦ 100-130 ብር/ኪ.ግ.'
      }
    },
    {
      name: 'Mixed Teff',
      amharic: 'ሰርገኛ ጤፍ',
      description: {
        en: 'A balanced blend of white and red teff, offering the best of both varieties.',
        am: 'የነጭ እና ቀይ ጤፍ ተቀላቅሎ የተዘጋጀ፣ የሁለቱንም የጤፍ ዓይነቶች ጥሩ ገጽታዎች የያዘ።'
      },
      bestFor: {
        en: 'Versatile for all teff-based dishes with balanced flavor',
        am: 'ለሁሉም የጤፍ ምግቦች ተስማሚ እና ሚዛናዊ ጣዕም ያለው'
      },
      storage: {
        en: 'Store in a cool, dry place in an airtight container for up to 1 year',
        am: 'በማቀዝቀዣ እና ደረቅ ቦታ በአየር-ጠባቂ ዕቃ ውስጥ እስከ 1 ዓመት ድረስ ያከማቹ'
      },
      priceRange: {
        en: 'Great value: 110-140 ETB/kg',
        am: 'ተመጣጣኝ ዋጋ፦ 110-140 ብር/ኪ.ግ.'
      }
    }
  ],
  benefits: {
    en: [
      'High in protein and essential amino acids',
      'Rich in iron, calcium, and fiber',
      'Gluten-free and easy to digest',
      'Low glycemic index, good for diabetics',
      'Packed with vitamins and minerals'
    ],
    am: [
      'በፕሮቲን እና አስፈላጊ አሚኖ አሲዶች የበለፀገ',
      'በብረታ ብረት፣ ካልሲየም እና ፋይበር የበለፀገ',
      'ግሉተን-ነፃ እና ለመፈጨት ቀላል',
      'የደም ስኳር መቀነስ ላለባቸው ሰዎች ተስማሚ',
      'በብዙ ቫይታሚኖች እና ማዕድናት የበለፀገ'
    ]
  },
  cookingTips: {
    en: [
      'For best injera, ferment the batter for 2-3 days',
      'Use a 2:1 ratio of water to teff flour for injera',
      'Cook on medium heat for even cooking',
      'Store cooked injera wrapped in a clean cloth',
      'Teff flour can be used as a thickener for soups and stews'
    ],
    am: [
      'ለጥሩ እንጀራ ገብሴውን ለ2-3 ቀናት ያብስሉት',
      'ለአንድ ኩባያ ዱቄት ሁለት ኩባያ ውሃ ይጠቀሙ',
      'በመካከለኛ እሳት ላይ እንዲቀጥሉ ያድርጉ',
      'የተቆረጠ እንጀራ በንጹህ ጨርቅ ጠቅጥቀው ያከማቹት',
      'የጤፍ ዱቄት ለሾርባ እና ለወጥ እንደ ማስቀላጫ ያገለግላል'
    ]
  }
};

export const askTeffAssistant = async (prompt: string, language: 'am' | 'en' = 'en'): Promise<string> => {
  try {
    // Check for greetings first
    const greetings = {
      en: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'],
      am: ['ሰላም', 'ሰላማችሁ', 'እንደምን አላችሁ', 'ታዲያስ']
    };

    const isGreeting = [...greetings.en, ...greetings.am].some(greeting => 
      prompt.toLowerCase().includes(greeting)
    );

    if (isGreeting) {
      const time = new Date().getHours();
      let greeting = '';
      
      if (language === 'am') {
        greeting = time < 12 ? 'እንኳን ደህና መጡ! እለም ለጤፍ ጥያቄ አለህ/ሽ? እባክህ/ሽ ጥያቄህን/ሽን ጨርስ/ጨርሺ።' :
                   time < 18 ? 'እንኳን ደስ ያለህ/ሽ! ስለ ጤፍ ማወቅ የምትፈልገው ነገር አለ?' :
                   'እንኳን ደህና መጣህ/ሽ! ስለ ጤፍ ማወቅ የምትፈልገው ነገር አለ?';
      } else {
        greeting = time < 12 ? 'Good morning! How can I help you with teff today?' :
                   time < 18 ? 'Good afternoon! What would you like to know about teff?' :
                   'Good evening! How can I assist you with teff products?';
      }
      return greeting;
    }

    // Check if the question is about teff
    const teffKeywords = {
      en: ['teff', 'injera', 'tella', 'tihlo', 'kita', 'genfo'],
      am: ['ጤፍ', 'እንጀራ', 'ጠላ', 'ጥሕል', 'ኪታ', 'ገንፎ']
    };

    const isAboutTeff = [...teffKeywords.en, ...teffKeywords.am].some(keyword => 
      prompt.toLowerCase().includes(keyword)
    );

    if (!isAboutTeff) {
      return language === 'am' 
        ? 'ይቅርታ፣ እኔ ስለ ጤፍ ብቻ መረጃ ልሰጥ እችላለሁ። ስለ ጤፍ የሚፈልጉት ነገር አለ?'
        : 'I\'m sorry, I can only provide information about teff products. Is there something you\'d like to know about teff?';
    }

    // Check for specific teff type questions
    const teffType = TEFF_INFO.types.find(type => 
      prompt.toLowerCase().includes(type.name.toLowerCase()) || 
      (type.amharic && prompt.includes(type.amharic))
    );

    // Check for merchant-related questions
    const merchantKeywords = ['merchant', 'seller', 'vendor', 'ሻጭ', 'የሸጠ', 'የሚሸጥ'];
    const isMerchantQuestion = merchantKeywords.some(term => 
      prompt.toLowerCase().includes(term.toLowerCase())
    );

    // Check for price-related questions
    const isPriceQuestion = ['price', 'cost', 'how much', 'ዋጋ', 'ብር', 'ክስተት'].some(term =>
      prompt.toLowerCase().includes(term.toLowerCase())
    );

    // Check for cooking/preparation questions
    const isCookingQuestion = ['cook', 'prepare', 'make', 'how to', 'recipe', 'መመገብ', 'አዘገጃጀት', 'አሰራር', 'መስራት'].some(term =>
      prompt.toLowerCase().includes(term.toLowerCase())
    );

    // Check for description questions
    const isDescriptionQuestion = ['what is', 'describe', 'about', 'tell me about', 'ምንድነው', 'እንዴት ነው', 'በቃ'].some(term =>
      prompt.toLowerCase().includes(term.toLowerCase())
    );

    let response = '';
    const langKey = language as 'en' | 'am';

    // Handle merchant-related questions
    if (isMerchantQuestion) {
      try {
        // Fetch actual merchants from the API
        const response = await fetch('/api/v1/admin/merchants');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch merchants');
        }

        const merchants = data.data || [];

        if (merchants.length === 0) {
          return language === 'am'
            ? 'በአሁኑ ጊዜ ምንም የጤፍ ሻጮች አልተገኙም። እባክዎ ቆይተው ይሞክሩ።'
            : 'There are currently no teff merchants available. Please check back later.';
        }

        let responseText = language === 'am'
          ? 'የሚገኙ የጤፍ ሻጮች፦\n\n'
          : 'Available teff merchants and their products:\n\n';

        // Get products for each merchant
        for (const merchant of merchants) {
          const productsResponse = await fetch(`/api/v1/merchants/${merchant._id}/products`);
          const productsData = await productsResponse.json();
          const products = productsData.data || [];
          
          responseText += language === 'am'
            ? `🏪 ${merchant.name || 'ሻጭ'}\n` +
              `📍 አካባቢ: ${merchant.location || 'አልተገለጸም'}\n` +
              `📞 ስልክ: ${merchant.phone || 'አልተገለጸም'}\n`
            : `🏪 ${merchant.name || 'Merchant'}\n` +
              `📍 Location: ${merchant.location || 'Not specified'}\n` +
              `📞 Phone: ${merchant.phone || 'Not specified'}\n`;
          
          if (products.length > 0) {
            responseText += language === 'am'
              ? '🛒 ምርቶች፦\n'
              : '🛒 Products:\n';
            
            products.forEach((product: any) => {
              responseText += language === 'am'
                ? `   • ${product.name}: ${product.price} ብር (${product.stockAvailable} ኪ.ግ. ቀሪ አለ)\n`
                : `   • ${product.name}: ${product.price} ETB (${product.stockAvailable} kg available)\n`;
            });
          } else {
            responseText += language === 'am'
              ? 'ℹ️ ምንም ምርቶች አልተገኙም\n\n'
              : 'ℹ️ No products available\n\n';
          }
          
          responseText += '\n';
        }

        responseText += language === 'am'
          ? 'ለበለጠ መረጃ እባክዎ የተወሰነውን ሻጭ ወይም ምርት ይጠይቁ።'
          : 'For more information, please ask about a specific merchant or product.';

        return responseText;
      } catch (error) {
        console.error('Error fetching merchants:', error);
        return language === 'am'
          ? 'የሻጮችን ዝርዝር ለማግኘት ሲታገል ስህተት ተፈጥሯል። እባክዎ ቆይተው ይሞክሩ።'
          : 'An error occurred while fetching the list of merchants. Please try again later.';
      }
    }

    if (teffType) {
      // If asking about a specific teff type
      if (isPriceQuestion) {
        // Only provide price if specifically asked
        response = language === 'am'
          ? `${teffType.amharic} ጤፍ ዋጋ: ${teffType.priceRange[langKey]}`
          : `${teffType.name} teff price: ${teffType.priceRange[langKey]}`;
      } 
      else if (isCookingQuestion) {
        // Only provide cooking info if specifically asked
        response = language === 'am'
          ? `ለ${teffType.amharic} ጤፍ የምግብ አሰራር ምክሮች፦\n• ${TEFF_INFO.cookingTips[langKey][0]}\n• ${TEFF_INFO.cookingTips[langKey][1]}`
          : `Cooking tips for ${teffType.name} teff:\n• ${TEFF_INFO.cookingTips[langKey][0]}\n• ${TEFF_INFO.cookingTips[langKey][1]}`;
      }
      else if (isDescriptionQuestion) {
        // Only provide description if specifically asked
        response = language === 'am'
          ? `${teffType.amharic} ${teffType.description.am}`
          : `${teffType.name} teff ${teffType.description.en}`;
      }
      else {
        // Default minimal response
        response = language === 'am'
          ? `${teffType.amharic} ጤፍ ላይ የበለጠ መረጃ ያስፈልግዎታል? ስለ ዋጋ፣ የምግብ አሰራር ወይም ሌላ ዝርዝር መረጃ ልጠይቅ ይችላሉ?`
          : `Would you like more information about ${teffType.name} teff? You can ask about price, cooking methods, or other details.`;
      }
    }
    else if (isPriceQuestion) {
      // Only list prices if specifically asked
      response = language === 'am' 
        ? 'የጤፍ ዋጋዎች፦\n'
        : 'Teff prices:\n';
      
      TEFF_INFO.types.forEach(type => {
        response += language === 'am'
          ? `• ${type.amharic}: ${type.priceRange[langKey]}\n`
          : `• ${type.name}: ${type.priceRange[langKey]}\n`;
      });
    }
    else if (isCookingQuestion) {
      // Only provide cooking info if specifically asked
      response = language === 'am' 
        ? 'የጤፍ ምግቦችን ለመስራት ሁለት ዋና ዋና ምክሮች፦\n• ' + TEFF_INFO.cookingTips[langKey][0] + '\n• ' + TEFF_INFO.cookingTips[langKey][1]
        : 'Two main teff cooking tips:\n• ' + TEFF_INFO.cookingTips[langKey][0] + '\n• ' + TEFF_INFO.cookingTips[langKey][1];
    }
    else if (isDescriptionQuestion) {
      // Only provide general description if specifically asked
      response = language === 'am' 
        ? 'ጤፍ በኢትዮጵያ የሚመረት ዋና የእህል አይነት ነው። ዋነኛው ምግብ የሆነውን እንጀራ ለመስራት ያገለግላል።'
        : 'Teff is a staple grain in Ethiopian cuisine, primarily used to make injera. It is gluten-free and rich in nutrients like iron and calcium.';
    }
    else {
      // For any other questions, ask for clarification
      return language === 'am'
        ? 'ይቅርታ፣ ስለ ጤፍ የበለጠ የተወሰነ ጥያቄ ልትጠይቁ ይችላሉ? ለምሳሌ፡ የተወሰነ የጤፍ ዓይነት ዋጋ፣ የምግብ አሰራር ወይም ሌላ ዝርዝር መረጃ።'
        : 'Could you please ask a more specific question about teff? For example: price of a specific teff type, cooking methods, or other details.';
    }

    return response;
  } catch (error) {
    console.error("Gemini Error:", error);
    return language === 'am' 
      ? "ይቅርታ፣ አሁን ረዳቱን ማግኘት አልተቻለም። እባክዎ ቆይተው ይሞክሩ።" 
      : "Sorry, I'm having trouble connecting to the assistant. Please try again later.";
  }
};
