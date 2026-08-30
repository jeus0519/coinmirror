import { type InvestmentTypeProfile } from './investment-type';

export type ShareCardContext = 'expected' | 'recorded';

export type ShareCardViewModel = {
  label: string;
  title: string;
  code: string;
  axisLine: string;
  description: string;
  watermark: string;
  compliance: string;
};

const COMPLIANCE_COPY =
  '투자거울 타입은 성격검사나 투자조언이 아니라, 거래 행동을 돌아보기 위한 재미용 비유입니다.';

export function buildInvestmentTypeShareCard(
  profile: InvestmentTypeProfile,
  context: ShareCardContext
): ShareCardViewModel {
  return {
    label: context === 'expected' ? '예상 타입' : '최근 거래 기록 기준',
    title: profile.title,
    code: profile.code,
    axisLine: profile.axes.map((axis) => `${axis.code} ${axis.label}`).join(' · '),
    description:
      context === 'expected'
        ? '거래내역 업로드 전 내 답변만으로 만든 가벼운 예상 카드예요.'
        : '최근 거래 기록에서 반복 행동을 요약한 회고 카드예요.',
    watermark: 'coinmirror.app',
    compliance: COMPLIANCE_COPY,
  };
}

export function serializeShareCardText(card: ShareCardViewModel) {
  return [
    card.label,
    card.title,
    card.code,
    card.axisLine,
    card.description,
    card.watermark,
    card.compliance,
  ].join('\n');
}
