/** Only explicit form preparation, or agreement to one clear form offer, opens a form. */
export function wantsApplicationForm(text:string, previousAssistant=''):boolean {
 const value=text.trim()
 if(/(?:신청|제출).{0,5}(?:하지\s*마|안\s*할|취소)|신청\s*안\s*해/.test(value))return false
 if(/^(?:응|네|예|좋아|좋아요|그래|ㅇㅇ|해줘)[.!\s]*$/.test(value))return /신청서.{0,18}(?:확인|읽|작성|준비).{0,12}(?:볼까요|할까요)|신청\s*내용.{0,12}준비해\s*볼까요/.test(previousAssistant)
 if(/(?:폼|신청서)/.test(value)&&/신청|열|읽|불러|확인|작성|도와|같이|보여/.test(value))return true
 if(/신청.*(?:가능|할\s*수|자격|조건|기간|마감|언제|방법)/.test(value))return false
 return /신청\s*(?:해|할래|하자|진행|같이|함께|하고|도와|대신)|신청.{0,10}(?:해\s*줘|해주세요|해달|해다|줘|달라고)/.test(value)
}
