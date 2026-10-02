import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CANONICAL_URL = 'https://www.coinmirror.kr';
const OG_IMAGE_PATH = '/og/coinmirror-og.png';
const OG_IMAGE_URL = `${CANONICAL_URL}${OG_IMAGE_PATH}`;

function readPngSize(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  assert.equal(buffer.toString('ascii', 1, 4), 'PNG', 'file must be a PNG image');
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

test('SEO metadata uses the canonical custom domain and A안 sharing copy', async () => {
  const { buildCoinmirrorMetadata } = await import('../src/lib/seo-metadata.ts');

  const metadata = buildCoinmirrorMetadata();

  assert.equal(metadata.title, '코인미러 | 거래 기록으로 보는 나의 투자 습관');
  assert.equal(
    metadata.description,
    '스코어 기반 성향 진단과 AI 행동 코칭으로 내 투자 습관을 질문으로 돌아봅니다.'
  );
  assert.equal(metadata.metadataBase?.toString(), `${CANONICAL_URL}/`);
  assert.equal(metadata.alternates?.canonical, CANONICAL_URL);
  assert.equal(metadata.openGraph?.url, CANONICAL_URL);
  assert.equal(metadata.openGraph?.title, metadata.title);
  assert.equal(metadata.openGraph?.description, metadata.description);
  assert.deepEqual(metadata.openGraph?.images, [
    {
      url: OG_IMAGE_URL,
      width: 1200,
      height: 630,
      alt: '코인미러 - 거래 기록으로 보는 나의 투자 습관',
    },
  ]);
  assert.equal(metadata.twitter?.card, 'summary_large_image');
  assert.equal(metadata.twitter?.title, metadata.title);
  assert.equal(metadata.twitter?.description, metadata.description);
  assert.deepEqual(metadata.twitter?.images, [OG_IMAGE_URL]);
});

test('Open Graph preview image is a 1200x630 PNG in the public directory', () => {
  const imagePath = path.join(PROJECT_ROOT, 'public', 'og', 'coinmirror-og.png');

  assert.ok(fs.existsSync(imagePath), 'OG image must exist at public/og/coinmirror-og.png');
  const size = readPngSize(imagePath);
  assert.deepEqual(size, { width: 1200, height: 630 });
});
