import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import {
  defaultDiagnosisAnswers,
  diagnosisQuestions,
  summarizeDiagnosis,
  type DiagnosisQuestionId,
} from '@/lib/onboarding-diagnosis';
import { cn } from '@/lib/utils';
import { useFlowStore } from '@/stores/use-flow-store';

export function Step2Diagnosis() {
  const savedAnswers = useFlowStore((s) => s.diagnosisAnswers);
  const saveDiagnosis = useFlowStore((s) => s.saveDiagnosis);
  const [answers, setAnswers] = useState<Record<DiagnosisQuestionId, string>>({
    ...defaultDiagnosisAnswers,
    ...savedAnswers,
  });

  const summary = useMemo(() => summarizeDiagnosis(answers), [answers]);
  const answeredCount = diagnosisQuestions.filter((q) => answers[q.id]).length;

  function choose(questionId: DiagnosisQuestionId, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-6 p-4 pb-12">
      <View className="gap-2">
        <Text className="text-lg font-extrabold text-foreground">내 투자 거울 설정</Text>
        <Text className="text-[13px] leading-5 text-muted-foreground">
          거래내역을 보기 전에, 코인미러가 어떤 기준으로 당신의 매매 습관을 비춰볼지 먼저
          알려주세요. 이 답변은 추천이나 예측이 아니라 스코어 해석과 목표 템플릿 개인화에만
          사용됩니다.
        </Text>
      </View>

      <Card>
        <CardContent className="gap-2 pt-2">
          <Text className="text-sm font-bold text-foreground">진단 요약 미리보기</Text>
          <Text className="text-[13px] leading-5 text-foreground">{summary.headline}</Text>
          <View className="flex-row flex-wrap gap-1.5">
            {[`스타일: ${summary.style}`, `목표: ${summary.goal}`, `주요 고민: ${summary.primaryFocus}`].map(
              (item) => (
                <View key={item} className="rounded-full bg-primary/10 px-2.5 py-1">
                  <Text className="text-[11px] font-bold text-primary">{item}</Text>
                </View>
              )
            )}
          </View>
        </CardContent>
      </Card>

      <View className="gap-4">
        {diagnosisQuestions.map((question, index) => (
          <View key={question.id} className="gap-2.5 rounded-2xl border border-border bg-card p-4">
            <View className="gap-1">
              <Text className="text-[11px] font-extrabold text-primary">
                Q{index + 1} · 스코어 진단 기준
              </Text>
              <Text className="text-[15px] font-extrabold text-foreground">{question.title}</Text>
              <Text className="text-xs leading-5 text-muted-foreground">{question.description}</Text>
            </View>
            <View className="gap-2">
              {question.options.map((option) => {
                const selected = answers[question.id] === option.id;
                return (
                  <Button
                    key={option.id}
                    variant={selected ? 'default' : 'outline'}
                    className={cn('justify-start', selected && 'border-primary')}
                    onPress={() => choose(question.id, option.id)}
                  >
                    <View className="flex-1 items-start gap-0.5">
                      <Text className={selected ? 'text-primary-foreground' : 'text-foreground'}>
                        {option.label}
                      </Text>
                      <Text
                        className={cn(
                          'text-[11px]',
                          selected ? 'text-primary-foreground/75' : 'text-muted-foreground'
                        )}
                      >
                        연결: {option.scoreLinks.join(' · ')}
                      </Text>
                    </View>
                  </Button>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <View className="gap-2 rounded-2xl bg-foreground p-5">
        <Text className="text-base font-extrabold text-background">다음 단계</Text>
        <Text className="text-[13px] leading-5 text-background/75">
          {answeredCount}/{diagnosisQuestions.length}개 답변을 바탕으로 CSV 분석 결과의 우선순위와
          회고 질문을 개인화합니다. 이후 예시 데이터 또는 내 CSV를 불러오면 바로 스코어를 볼 수
          있습니다.
        </Text>
        <Button onPress={() => saveDiagnosis(answers)}>
          <Text>진단 저장하고 거래내역 불러오기</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
