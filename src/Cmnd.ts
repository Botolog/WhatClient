export class Cmnds{
    history: string[] = []
    step: number = -1

    add(txt: string){
        this.history.unshift(txt);
        this.step = -1
    }

    get(){
        
        if (this.step < 0) return ""
        // console.log(this.step);
        return this.history[this.step]
        return ""
    }

    after(){
        this.step = Math.max(this.step-1,-1)
        return this.get()
    }

    before(){
        this.step = Math.min(this.step+1,this.history.length-1)
        return this.get()
    }
}

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

  
//   // Example usage:
//   const text1 = "123 asd שדג";
//   const reversedText1 = H(text1);
//   console.log(`Original: "${text1}"`);
//   console.log(`Reversed: "${reversedText1}"`); // Output: Reversed: "123 asd גדש"
  
//   const text2 = "Hello עולם!";
//   const reversedText2 = H(text2);
//   console.log(`Original: "${text2}"`);
//   console.log(`Reversed: "${reversedText2}"`); // Output: Reversed: "Hello םלוע!"
  
//   const text3 = "abc דגא xyz";
//   const reversedText3 = H(text3);
//   console.log(`Original: "${text3}"`);
//   console.log(`Reversed: "${reversedText3}"`); // Output: Reversed: "abc אגד xyz"
  
//   const text4 = "שלום world שלום";
//   const reversedText4 = H(text4);
//   console.log(`Original: "${text4}"`);
//   console.log(`Reversed: "${reversedText4}"`); // Output: Reversed: "םולש world םולש"
  
//   const text5 = "!@#$%^&*()_+=-`~[]{};':\",./<>?";
//   const reversedText5 = H(text5);
//   console.log(`Original: "${text5}"`);
//   console.log(`Reversed: "${reversedText5}"`); // Output: Reversed: "!@#$%^&*()_+=-`~[]{};':\",./<>?"
  
//   const text6 = "English only";
//   const reversedText6 = H(text6);
//   console.log(`Original: "${text6}"`);
//   console.log(`Reversed: "${reversedText6}"`); // Output: Reversed: "English only"
  
  const text7 = "שלום-לכם אנשים";
  const reversedText7 = H1(text7);
  console.log(`Original: "${text7}"`);
  console.log(`Reversed: "${reversedText7}"`); // Output: Reversed: "123"