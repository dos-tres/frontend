export function shouldOfferCheckin(text:string) {
 const value=text.trim()
 return /뭘.*(?:모르|해야)|무엇.*모르|뭐.*해야.*모르|어디(?:서|부터).*시작|막막|모르겠|못\s*정하|못\s*정했|뭘.*고르|뭐.*좋을지/.test(value)||/^(?:하+|휴+|에휴|ㅠ+|ㅜ+|음+)[.!…\s]*$/.test(value)
}
