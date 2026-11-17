# 조이 이미지

실제 이미지 파일입니다. 기존 생성 PNG 원본을 SVG 안에 포함했으며 별도 다운로드·복원이 필요하지 않습니다. 벡터로 다시 그린 이미지가 아닙니다.

- joy-greeting.svg: 인사 포즈, 1536×1024
- joy-thinking.svg: 생각 포즈, 1254×1254

```tsx
import joyGreeting from './assets/characters/joy-greeting.svg'
import joyThinking from './assets/characters/joy-thinking.svg'

<img src={joyGreeting} alt="반갑게 인사하는 조이" />
<img src={joyThinking} alt="생각 중인 조이" />
```

원본 비율을 유지하고 object-fit: contain을 사용합니다. 기준 이미지를 확인한 뒤 필요한 화면에 배치합니다.
