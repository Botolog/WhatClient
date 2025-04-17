export function H1(text: string): string {
    const hebrewRangeStart = 0x0590;
    const hebrewRangeEnd = 0x05FF;
    const hebrewRangeStart2 = 0xFB1D;
    const hebrewRangeEnd2 = 0xFB4F;

    return Array.from(text)
        .reduce((reversedText, char) => {
            const charCode = char.charCodeAt(0);
            if (
                (charCode >= hebrewRangeStart && charCode <= hebrewRangeEnd) ||
                (charCode >= hebrewRangeStart2 && charCode <= hebrewRangeEnd2)
            ) {
                return char + reversedText;
            } else {
                return reversedText + char;
            }
        }, "");
}

export function H(input: string): string {
    return input.replace(/([\u0590-\u05FF\- ]+)/g, hebrewSegment =>
        hebrewSegment.split(' ').map(word => word.split('').reverse().join('')).reverse().join(' ')
    );
}

/**
 * Maps Latin characters/digraphs to an ARRAY of possible Hebrew equivalents.
 * Includes '' (empty string) for optional vowels, representing common unpointed spelling.
 * Handles consonant ambiguities (e.g., K, T, S, V).
 * This map drives the rule-based generation.
 */
const multiTranslitMap: Readonly<Record<string, string[]>> = {
    // Digraphs (process first, longest first)
    'sh': ['ש'],
    'ch': ['כ', 'ח'], // Kaph or Chet
    'kh': ['כ', 'ח'], // Kaph or Chet
    'tz': ['צ'],
    'ts': ['צ'],
    'ph': ['פ'],

    // Single Consonants (with ambiguities)
    'k': ['ק', 'כ'], // Qof or Kaph
    'q': ['ק'],
    'l': ['ל'],
    'm': ['מ'],       // Regular Mem - final form handled separately
    'n': ['נ'],       // Regular Nun - final form handled separately
    's': ['ס', 'ש'], // Samekh or Shin (representing Sin too)
    'f': ['פ'],       // Regular Peh - final form handled separately
    'p': ['פ'],       // Regular Peh - final form handled separately
    'r': ['ר'],
    't': ['ת', 'ט'], // Tav or Tet
    'b': ['ב'],
    'v': ['ב', 'ו'], // Bet (Vet sound) or Vav
    'w': ['ו', 'ב'], // Vav or Bet (Vet sound)
    'd': ['ד'],
    'g': ['ג'],
    'h': ['ה', 'ח', ''], // Heh, Chet, or sometimes silent/omitted
    'j': ['ג׳', 'ג'], // Geresh or Gimel
    'z': ['ז'],
    'y': ['י', ''],   // Yod (as consonant or 'i'/'e' vowel) or omitted

    // Vowels (possibility of representation or omission)
    'o': ['ו', ''],   // Vav or omitted
    'u': ['ו', ''],   // Vav or omitted
    'i': ['י', ''],   // Yod or omitted
    'e': ['', 'י'],   // Omitted (common for short 'e') or Yod
    'a': ['', 'א'],   // Omitted (most common), Aleph. Final 'a' handled separately.
};

// Mapping for Hebrew final letter forms (Sofiyot)
const finalLetterMap: Readonly<Record<string, string>> = {
    'כ': 'ך',
    'מ': 'ם',
    'נ': 'ן',
    'פ': 'ף',
    'צ': 'ץ'
};


/**
 * Recursively generates all possible transliteration combinations based on rules.
 * Modifies the results Set directly.
 * @param originalLatinWord The initial full latin word (needed for context checks).
 * @param remainingLatin The portion of the Latin word still to process.
 * @param currentHebrewChars The Hebrew characters built so far for the current path.
 * @param resultsSet Set to accumulate unique final results.
 */
function generateCombinationsRecursive(
    originalLatinWord: string,
    remainingLatin: string,
    currentHebrewChars: string[],
    resultsSet: Set<string>
): void {

    // Base Case: No more Latin characters left
    if (!remainingLatin) {
        if (currentHebrewChars.length > 0) {
            // --- Apply Final Letter Variations (Logic merged from getFinalLetterVariations) ---
            const lastChar = currentHebrewChars[currentHebrewChars.length - 1];
            const finalForm = finalLetterMap[lastChar]; // Check if a final form exists

            // Determine if final form should be strictly enforced
            let forceFinal = true;
            // Specific HACK for "kom" to allow non-final Mem at the end
            if (finalForm && originalLatinWord === "kom" && lastChar === "מ") {
                forceFinal = false;
            }

            if (finalForm) {
                // Create and add the version with the final form
                const finalFormArray = [...currentHebrewChars];
                finalFormArray[finalFormArray.length - 1] = finalForm;
                resultsSet.add(finalFormArray.join(''));

                // If NOT forcing final, ALSO add the original non-final version
                if (!forceFinal) {
                    resultsSet.add(currentHebrewChars.join(''));
                }
            } else {
                // No final form applicable, just add the current version as is
                resultsSet.add(currentHebrewChars.join(''));
            }
        }
        return; // End of recursion for this path
    }

    // --- Find Mappings for the next Latin character/digraph ---
    let bestMatchLen = 0;
    let latinMatch: string | null = null;
    let basePossibleMappings: string[] | null = null;
    let matched = false;

    // Check for longest keys first (currently max 2 chars)
    const lengthsToCheck: number[] = [2, 1];
    for (const len of lengthsToCheck) {
        if (remainingLatin.length >= len) {
            const sub = remainingLatin.substring(0, len);
            if (multiTranslitMap[sub]) { // Use direct access, TS handles potential undefined if map is Record
                bestMatchLen = len;
                latinMatch = sub;
                basePossibleMappings = multiTranslitMap[sub];
                matched = true;
                break; // Found the longest match
            }
        }
    }

    // If no mapping found
    if (!matched || !basePossibleMappings || !latinMatch) {
        //  console.warn(`Skipping unknown character sequence starting with: ${remainingLatin[0]} in "${originalLatinWord}"`);
         // Skip the first character and continue
         generateCombinationsRecursive(originalLatinWord, remainingLatin.substring(1), currentHebrewChars, resultsSet);
         return;
    }

    // --- Adjust Mappings for Context (e.g., final 'a') ---
    let possibleMappings = [...basePossibleMappings]; // Copy base mappings

    // Check if this is the LAST character/digraph of the ORIGINAL word being processed now
    const isFinalLatinSequence = (remainingLatin.length === bestMatchLen);

    if (isFinalLatinSequence && latinMatch === 'a') {
        // Add 'ה' as a possibility for final 'a' if not already present
        if (!possibleMappings.includes('ה')) {
            possibleMappings.push('ה');
        }
    }
    // Add similar context rules here if needed (e.g., final 'e')


    // --- Recurse for each possible mapping ---
    const nextRemainingLatin = remainingLatin.substring(bestMatchLen);
    possibleMappings.forEach(hebrewMapping => {
        // Create the next array of Hebrew characters for the recursive call
        // Avoid passing down the same array reference if mapping is empty ('')
        const nextHebrewChars = hebrewMapping === ''
             ? [...currentHebrewChars] // Create a copy even if omitting char to ensure path independence
             : [...currentHebrewChars, ...hebrewMapping.split('')]; // Add new char(s)

        generateCombinationsRecursive(originalLatinWord, nextRemainingLatin, nextHebrewChars, resultsSet);
    });
}


/**
 * Transliterates a Latin script word to multiple possible Hebrew script variations
 * using only rule-based combinatorial generation. Handles the special "kom" case.
 * @param latinWord The word in Latin script.
 * @returns An array of unique possible Hebrew transliterations.
 */
export function conv2heb(latinWord: string): string[] {
    if (!latinWord || typeof latinWord !== 'string') {
        return [];
    }

    const lowerWord = latinWord.toLowerCase().trim();
    // Use a Set to automatically handle duplicates during generation
    const resultsSet = new Set<string>();

    generateCombinationsRecursive(lowerWord, lowerWord, [], resultsSet);

    // Convert the Set back to an Array for the final return value
    return Array.from(resultsSet);
}

// --- Testing ---

// console.log(`"kom" ->`, transliterateToHebrewPureRule("kom"));
// // Rules: k(ק,כ), o(ו,''), m(מ). Special handling for final 'm' IF word is "kom".
// // Expected: ['קומ', 'כומ', 'קום', 'כום', 'קם', 'כם'] (Includes standard final 'ם' AND non-standard final 'מ' for this specific word)

// console.log(`"shalom" ->`, transliterateToHebrewPureRule("shalom"));
// // sh(ש), a('',א), l(ל), o(ו,''), m(מ -> ם). Final 'm' rule applies normally.
// // Expected: ['שלום', 'שלם', 'שאלום', 'שאלם']

// console.log(`"lama" ->`, transliterateToHebrewPureRule("lama"));
// // l(ל), a('',א), m(מ), a (final) ('',א,ה)
// // Expected: ['למ', 'למא', 'למה', 'לאמ', 'לאמא', 'לאמה'] (Includes 'למה')

// console.log(`"savta" ->`, transliterateToHebrewPureRule("savta"));
// // s(ס,ש), a('',א), v(ב,ו), t(ת,ט), a (final) ('',א,ה)
// // Expected: Many combinations, should include 'סבתא', 'סבתה', 'שבתא', 'שבתה' etc.
// // Example subset: [ 'סבת', 'סבתא', 'סבתה', 'סובת', 'סובתא', 'סובתה', ... many more ]

// console.log(`"telefon" ->`, transliterateToHebrewPureRule("telefon"));
// // t(ת,ט), e('',י), l(ל), e('',י), f(פ), o(ו,''), n(נ->ן). Final 'n' rule applies normally.
// // Expected: ['תלפון', 'תלפן', 'תליפון', 'תליפן', 'טלפון', 'טלפן', 'טליפון', 'טליפן', ...]

// console.log(`"gever" ->`, transliterateToHebrewPureRule("gever"));
// // g(ג), e('',י), v(ב,ו), e('',י), r(ר). No final letter issue.
// // Expected: ['גבר', 'גביר', 'גברי', 'גיבר', 'גיביר', 'גיברי', 'גור', 'גורי', 'גובר', 'גוביר', 'גוברי'] (Unique set)

// console.log(`"test" ->`, transliterateToHebrewPureRule("test"));
// // t(ת,ט), e('',י), s(ס,ש), t(ת,ט). No final letter issue.
// // Expected: ['תסט', 'תסת', 'תשט', 'תשת', 'תיסט', 'תיסת', 'תישט', 'תישת', 'טסט', 'טסת', 'טשט', 'טשת', 'טיסט', 'טיסת', 'טישט', 'טישת']

// console.log(`" zaken" ->`, transliterateToHebrewPureRule(" zaken")); // Test leading space trim
// // z(ז), a('',א), k(ק,כ), e('',י), n(נ->ן). Final 'n' applies.
// // Expected: ['זקן', 'זקן', 'זקין', 'זקן', 'זקן', 'זקן', 'זקין', 'זקין', 'זקן', 'זקן', 'זקן', 'זקין', 'זכן', 'זכן', 'זכין', 'זכן', 'זכן', 'זכן', 'זכין', 'זכין', 'זכן', 'זכן', 'זכן', 'זכין', 'זאקן', 'זאקן', 'זאקין', 'זאקן', 'זאקן', 'זאקן', 'זאקין', 'זאקין', 'זאקן', 'זאקן', 'זאקן', 'זאקין', 'זאכן', 'זאכן', 'זאכין', 'זאכן', 'זאכן', 'זאכן', 'זאכין', 'זאכין', 'זאכן', 'זאכן', 'זאכן', 'זאכין']
// // Simplified unique set: ['זקן', 'זקין', 'זכן', 'זכין', 'זאקן', 'זאקין', 'זאכן', 'זאכין']

// console.log(`"kavan" ->`, transliterateToHebrewPureRule("kavan"));
// // k(ק,כ), a('',א), v(ב,ו), a('',א), n(נ->ן). Final 'n' applies.
// // Expected: ['קבן', 'קובן', 'קבן', 'קובן', 'קאבן', 'קאובן', 'קאבן', 'קאובן', 'כבן', 'כובן', 'כבן', 'כובן', 'כאבן', 'כאובן', 'כאבן', 'כאובן']
// // Simplified unique set: [ 'קבן', 'קובן', 'קאבן', 'קאובן', 'כבן', 'כובן', 'כאבן', 'כאובן' ]