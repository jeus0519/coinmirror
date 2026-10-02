const CANONICAL_URL = 'https://www.coinmirror.kr';
const OG_IMAGE_PATH = '/og/coinmirror-og.png';
const OG_IMAGE_URL = `${CANONICAL_URL}${OG_IMAGE_PATH}`;

export type CoinmirrorOpenGraphImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

export type CoinmirrorMetadata = {
  title: string;
  description: string;
  metadataBase: URL;
  alternates: {
    canonical: string;
  };
  openGraph: {
    type: 'website';
    siteName: string;
    locale: 'ko_KR';
    url: string;
    title: string;
    description: string;
    images: CoinmirrorOpenGraphImage[];
  };
  twitter: {
    card: 'summary_large_image';
    title: string;
    description: string;
    images: string[];
  };
};

export function buildCoinmirrorMetadata(): CoinmirrorMetadata {
  const title = '코인미러 | 거래 기록으로 보는 나의 투자 습관';
  const description = '스코어 기반 성향 진단과 AI 행동 코칭으로 내 투자 습관을 질문으로 돌아봅니다.';
  const imageAlt = '코인미러 - 거래 기록으로 보는 나의 투자 습관';

  return {
    title,
    description,
    metadataBase: new URL(CANONICAL_URL),
    alternates: {
      canonical: CANONICAL_URL,
    },
    openGraph: {
      type: 'website',
      siteName: '코인미러',
      locale: 'ko_KR',
      url: CANONICAL_URL,
      title,
      description,
      images: [
        {
          url: OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE_URL],
    },
  };
}
