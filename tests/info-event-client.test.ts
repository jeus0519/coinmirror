import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { loadInfoEventTabViewModel } from '../src/lib/info-event-client.ts';

test('정보 이벤트 클라이언트는 같은 출처 API의 시장 데이터와 이벤트를 합친다', async () => {
  const requested: string[] = [];
  const fetcher: typeof fetch = async (input) => {
    const url = String(input);
    requested.push(url);
    if (url === '/api/market-context') {
      return new Response(
        JSON.stringify({
          ok: true,
          marketTemperature: {
            title: '오늘 시장 분위기',
            description: '시장 배경',
            metrics: [],
            reading: '실데이터',
          },
          upbitKrwInterest: {
            title: '업비트 KRW 시장 관심 분포',
            description: 'BTC·ETH·XRP와 그 외 상위 3개',
            assets: [
              { rankLabel: '기본 확인', symbol: 'BTC', note: '기본', badge: '기본', volumeShareLabel: '전체 거래대금 중 10.0%' },
              { rankLabel: '기본 확인', symbol: 'ETH', note: '기본', badge: '기본', volumeShareLabel: '전체 거래대금 중 9.0%' },
              { rankLabel: '기본 확인', symbol: 'XRP', note: '기본', badge: '기본', volumeShareLabel: '전체 거래대금 중 8.0%' },
              { rankLabel: '그 외 상위 1', symbol: 'SOL', note: '상위', badge: '거래대금', volumeShareLabel: '전체 거래대금 중 7.0%' },
              { rankLabel: '그 외 상위 2', symbol: 'USDT', note: '상위', badge: 'USDT', volumeShareLabel: '전체 거래대금 중 6.0%' },
              { rankLabel: '그 외 상위 3', symbol: 'DOGE', note: '상위', badge: '거래대금', volumeShareLabel: '전체 거래대금 중 5.0%' },
            ],
            note: '실데이터',
          },
          safetyCopy: '시장 배경입니다.',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }
    if (url === '/api/exchange-events') {
      return new Response(
        JSON.stringify({
          ok: true,
          title: '거래소 이벤트 참고',
          description: '최신 이벤트',
          updatedAtLabel: '서버 캐시 기준',
          upbit: [{ exchange: '업비트', title: '업비트 최신 이벤트 제목', summary: '거래소에서 직접 확인하세요.', url: 'https://www.upbit.com/service_center/notice' }],
          bithumb: [{ exchange: '빗썸', title: '빗썸 최신 이벤트 제목', summary: '거래소에서 직접 확인하세요.', url: 'https://www.bithumb.com/react/feed/event/255' }],
          safetyCopy: '참여를 권유하지 않아요.',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }
    throw new Error(`unexpected URL: ${url}`);
  };

  const vm = await loadInfoEventTabViewModel(fetcher);

  assert.deepEqual(requested.sort(), ['/api/exchange-events', '/api/market-context']);
  assert.deepEqual(vm.upbitKrwInterest.assets.map((asset) => asset.symbol), ['BTC', 'ETH', 'XRP', 'SOL', 'USDT', 'DOGE']);
  assert.equal(vm.exchangeEvents.upbit[0]?.title, '업비트 최신 이벤트 제목');
  assert.equal(vm.exchangeEvents.bithumb[0]?.title, '빗썸 최신 이벤트 제목');
});

test('정보 이벤트 클라이언트는 API 실패 시 안전한 fallback view model을 유지한다', async () => {
  const vm = await loadInfoEventTabViewModel(async () => {
    throw new Error('offline');
  });

  assert.deepEqual(vm.upbitKrwInterest.assets.map((asset) => asset.symbol), ['BTC', 'ETH', 'XRP']);
  assert.equal(vm.exchangeEvents.upbit.length, 3);
  assert.equal(vm.exchangeEvents.bithumb.length, 3);
});

test('정보 이벤트 화면은 브라우저에서 거래소를 직접 호출하지 않고 같은 출처 API client를 사용한다', async () => {
  const source = await readFile('src/components/steps/step-4-info.tsx', 'utf8');

  assert.match(source, /loadInfoEventTabViewModel/);
  assert.match(source, /useEffect/);
  assert.doesNotMatch(source, /api\.upbit\.com|alternative\.me|bithumb\.com\/react\/feed/);
});
