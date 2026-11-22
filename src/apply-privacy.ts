import type {PersonalInformation} from './ProfileSettings'
export function maskApplicationText(text:string,personal:PersonalInformation,known:Record<string,string>={}) {
 let result=text
 const values={이름:personal.name,생년월일:personal.birthDate,연락처:personal.phone,이메일:personal.email,...known}
 for(const [key,raw] of Object.entries(values))if(raw)result=result.split(raw).join(`[${key}]`)
 return result.replace(/01[016789][- .]?\d{3,4}[- .]?\d{4}/g,'[연락처]').replace(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g,'[이메일]')
}
